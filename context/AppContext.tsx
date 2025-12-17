import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PostoData, InvoiceData, FuelItem, PriceItem, SavedModel, LayoutConfig, TaxRates } from '../types';
import { db } from '../services/StorageService';
import { BLANK_INVOICE, BLANK_POSTO } from '../constants/defaults';

const DEFAULT_TAX_RATES: TaxRates = { federal: '0,00', estadual: '0,00', municipal: '0,00' };

interface AppContextData {
  // Estados de Dados
  postoData: PostoData;
  setPostoData: React.Dispatch<React.SetStateAction<PostoData>>;
  invoiceData: InvoiceData;
  setInvoiceData: React.Dispatch<React.SetStateAction<InvoiceData>>;
  fuels: FuelItem[];
  setFuels: React.Dispatch<React.SetStateAction<FuelItem[]>>;
  prices: PriceItem[];
  setPrices: React.Dispatch<React.SetStateAction<PriceItem[]>>;
  taxRates: TaxRates;
  setTaxRates: React.Dispatch<React.SetStateAction<TaxRates>>;
  
  // Estados de Gerenciamento
  savedModels: SavedModel[];
  customLayouts: LayoutConfig[];
  selectedModelId: string;
  setSelectedModelId: React.Dispatch<React.SetStateAction<string>>;
  
  // Ações
  handleLoadModel: (id: string) => void;
  handleSaveModel: () => Promise<void>;
  handleDeleteModel: (id: string) => void;
  handleRenameModel: (id: string, newName: string) => void;
  handleNewModel: () => void;
  handleResetAll: () => void;
  handleImportBackup: (models: SavedModel[], layouts?: LayoutConfig[]) => void;
  handleDeleteLayout: (id: string) => void;
  handleUpdateTaxRates: (newRates: TaxRates) => void;
  
  // UI Helpers
  isSaving: boolean;
  notifications: { message: string; type: 'success' | 'error' | 'info'; id: number }[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextData>({} as AppContextData);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState<{ message: string; type: 'success' | 'error' | 'info'; id: number }[]>([]);
  
  // Dados Principais
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [postoData, setPostoData] = useState<PostoData>(BLANK_POSTO);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(BLANK_INVOICE);
  const [fuels, setFuels] = useState<FuelItem[]>([]);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRates>(DEFAULT_TAX_RATES);

  // Dados Persistidos
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [customLayouts, setCustomLayouts] = useState<LayoutConfig[]>([]);

  // Carregamento Inicial
  useEffect(() => {
    const models = db.getAllModels();
    setSavedModels(models);
    setCustomLayouts(db.getAllLayouts());
    if (models.length > 0 && !selectedModelId) {
       setTimeout(() => handleLoadModel(models[0].id), 50);
    }
  }, []);

  // Sincronização de Preços
  useEffect(() => {
    setFuels(currentFuels => {
      let hasChanges = false;
      const updatedFuels = currentFuels.map(fuel => {
        if (!fuel.productId) return fuel;
        const matchingPrice = prices.find(p => p.id === fuel.productId);
        if (!matchingPrice) return fuel;
        
        const isPriceChanged = fuel.unitPrice !== matchingPrice.price || fuel.unitPriceCard !== matchingPrice.priceCard;
        const isDataChanged = fuel.name !== matchingPrice.name || fuel.code !== matchingPrice.code;

        if (!isPriceChanged && !isDataChanged) return fuel;

        hasChanges = true;
        let newTotal = fuel.total;
        
        if (isPriceChanged) {
           const qty = parseFloat(fuel.quantity.replace(/\./g, '').replace(',', '.')) || 0;
           const price = parseFloat(matchingPrice.price.replace(/\./g, '').replace(',', '.')) || 0;
           newTotal = (qty * price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        return {
          ...fuel,
          name: matchingPrice.name,
          code: matchingPrice.code,
          unit: matchingPrice.unit,
          unitPrice: matchingPrice.price,
          unitPriceCard: matchingPrice.priceCard,
          total: newTotal
        };
      });
      return hasChanges ? updatedFuels : currentFuels;
    });
  }, [prices]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { message, type, id }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const handleUpdateTaxRates = (newRates: TaxRates) => {
    setTaxRates(newRates);
    setInvoiceData(prev => ({
      ...prev,
      impostos: { ...prev.impostos, ...newRates }
    }));
  };

  const handleLoadModel = (id: string) => {
    const model = db.getModelById(id);
    if (!model) {
      showToast("Modelo não encontrado.", "error");
      return;
    }
    setPostoData(JSON.parse(JSON.stringify({ ...BLANK_POSTO, ...model.postoData })));
    setPrices(model.prices ? JSON.parse(JSON.stringify(model.prices)) : []);
    setTaxRates({ ...DEFAULT_TAX_RATES, ...(model.taxRates || {}) });
    setFuels(model.fuels ? JSON.parse(JSON.stringify(model.fuels)) : []);
    
    let loadedInvoice = JSON.parse(JSON.stringify(BLANK_INVOICE));
    if (model.invoiceData) {
       loadedInvoice = { ...BLANK_INVOICE, ...model.invoiceData };
    } else if (model.impostos) {
       loadedInvoice.impostos = model.impostos;
    }
    setInvoiceData(loadedInvoice);
    setSelectedModelId(id);
    showToast(`Modelo carregado: ${model.name}`, "info");
  };

  const handleSaveModel = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 400));
    try {
      const now = new Date().toISOString();
      const currentId = selectedModelId || Date.now().toString();
      const autoName = postoData.razaoSocial ? postoData.razaoSocial.substring(0, 30) : `Modelo ${new Date().toLocaleTimeString()}`;

      const modelToSave: SavedModel = {
        id: currentId,
        name: selectedModelId ? (savedModels.find(m => m.id === currentId)?.name || autoName) : autoName,
        updatedAt: now,
        postoData, prices, taxRates, invoiceData, fuels
      };

      const updatedList = db.saveOrUpdateModel(modelToSave);
      setSavedModels(updatedList);
      setSelectedModelId(currentId);
      showToast(selectedModelId ? "Modelo atualizado!" : "Novo modelo criado!", "success");
    } catch (error) {
      console.error(error);
      showToast("Erro ao salvar.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteModel = (id: string) => {
    const newList = db.deleteModel(id);
    setSavedModels(newList);
    if (id === selectedModelId) {
      if (newList.length > 0) handleLoadModel(newList[0].id);
      else handleNewModel();
    }
    showToast("Modelo excluído.", "info");
  };

  const handleRenameModel = (id: string, newName: string) => {
     const model = savedModels.find(m => m.id === id);
     if (model) {
        const updated = { ...model, name: newName, updatedAt: new Date().toISOString() };
        setSavedModels(db.saveOrUpdateModel(updated));
        showToast("Renomeado!", "success");
     }
  };

  const handleNewModel = () => {
    setSelectedModelId('');
    setPostoData({ ...BLANK_POSTO });
    setInvoiceData({ ...BLANK_INVOICE });
    setFuels([]);
    setPrices([]);
    setTaxRates({ ...DEFAULT_TAX_RATES });
    showToast("Editor limpo.", "info");
  };

  const handleResetAll = () => {
    const defaults = db.resetModels();
    setSavedModels(defaults);
    handleLoadModel(defaults[0].id);
    showToast("Dados resetados.", "success");
  };

  const handleImportBackup = (models: SavedModel[], layouts?: LayoutConfig[]) => {
    db.saveModels(models);
    if (layouts) {
       db.saveLayouts(layouts);
       setCustomLayouts(layouts);
    }
    setSavedModels(models);
    if (models.length > 0) handleLoadModel(models[0].id);
    else handleNewModel();
    showToast(`Backup restaurado: ${models.length} modelos.`, "success");
  };

  const handleDeleteLayout = (id: string) => {
     if (customLayouts.length <= 1) {
       showToast("Necessário 1 layout mínimo.", "error");
       return;
     }
     const newLayouts = customLayouts.filter(l => l.id !== id);
     db.saveLayouts(newLayouts);
     setCustomLayouts(newLayouts);
     if (postoData.activeLayoutId === id) {
        setPostoData(prev => ({ ...prev, activeLayoutId: newLayouts[0].id }));
     }
     showToast("Layout excluído.", "info");
  };

  return (
    <AppContext.Provider value={{
      postoData, setPostoData,
      invoiceData, setInvoiceData,
      fuels, setFuels,
      prices, setPrices,
      taxRates, setTaxRates,
      savedModels, customLayouts,
      selectedModelId, setSelectedModelId,
      handleLoadModel, handleSaveModel, handleDeleteModel,
      handleRenameModel, handleNewModel, handleResetAll, handleImportBackup, handleDeleteLayout, handleUpdateTaxRates,
      isSaving, notifications, showToast
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
