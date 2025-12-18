import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { PostoData, InvoiceData, FuelItem, PriceItem, SavedModel, LayoutConfig, TaxRates } from '../types';
import { db } from '../services/storage';
import { BLANK_INVOICE, BLANK_POSTO } from '../utils/constants';
import { parseLocaleNumber, toCurrency, quantityToFloat } from '../utils/helpers';

const DEFAULT_TAX_RATES: TaxRates = { federal: '0,00', estadual: '0,00', municipal: '0,00' };

interface AppContextData {
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
  savedModels: SavedModel[];
  customLayouts: LayoutConfig[];
  selectedModelId: string;
  setSelectedModelId: React.Dispatch<React.SetStateAction<string>>;
  handleLoadModel: (id: string) => void;
  handleSaveModel: () => Promise<void>;
  handleDeleteModel: (id: string) => void;
  handleRenameModel: (id: string, newName: string) => void;
  handleNewModel: () => void;
  handleResetAll: () => void;
  handleImportBackup: (models: SavedModel[], layouts?: LayoutConfig[]) => void;
  handleDeleteLayout: (id: string) => void;
  handleUpdateTaxRates: (newRates: TaxRates) => void;
  isSaving: boolean;
  notifications: { message: string; type: 'success' | 'error' | 'info'; id: number }[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextData>({} as AppContextData);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState<{ message: string; type: 'success' | 'error' | 'info'; id: number }[]>([]);
  
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [postoData, setPostoData] = useState<PostoData>(BLANK_POSTO);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(BLANK_INVOICE);
  const [fuels, setFuels] = useState<FuelItem[]>([]);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRates>(DEFAULT_TAX_RATES);

  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [customLayouts, setCustomLayouts] = useState<LayoutConfig[]>([]);

  const isInitialLoad = useRef(true);

  useEffect(() => {
    const models = db.getAllModels();
    const layouts = db.getAllLayouts();
    setSavedModels(models);
    setCustomLayouts(layouts);

    const lastId = db.getLastActiveId();
    if (lastId && models.find(m => m.id === lastId)) {
      handleLoadModel(lastId);
    } else if (models.length > 0) {
      handleLoadModel(models[0].id);
    }
    
    setTimeout(() => { isInitialLoad.current = false; }, 500);
  }, []);

  useEffect(() => {
    if (isInitialLoad.current || fuels.length === 0) return;
    const isCard = ['CARTAO', 'CREDITO', 'DEBITO'].includes(invoiceData.formaPagamento);
    
    setFuels(prevFuels => prevFuels.map(item => {
      const product = prices.find(p => p.id === item.productId || p.code === item.code);
      if (!product) return item;
      const activePriceStr = isCard && product.priceCard && parseLocaleNumber(product.priceCard) > 0 
        ? product.priceCard 
        : product.price;
      const unitPrice = parseLocaleNumber(activePriceStr);
      const qty = quantityToFloat(item.quantity);
      const newTotal = toCurrency(qty * unitPrice);
      if (item.total === newTotal) return item;
      return { ...item, unitPrice: product.price, unitPriceCard: product.priceCard, total: newTotal };
    }));
  }, [invoiceData.formaPagamento, prices]);

  useEffect(() => {
    if (isInitialLoad.current || !selectedModelId) return;
    const autoSaveTimer = setTimeout(() => {
      const currentModel = savedModels.find(m => m.id === selectedModelId);
      if (!currentModel) return;
      const modelToUpdate: SavedModel = {
        ...currentModel, postoData, prices, taxRates, invoiceData, fuels,
        updatedAt: new Date().toISOString()
      };
      const updatedList = db.saveOrUpdateModel(modelToUpdate);
      setSavedModels(updatedList);
      db.saveLastActiveId(selectedModelId);
    }, 1000);
    return () => clearTimeout(autoSaveTimer);
  }, [postoData, prices, taxRates, invoiceData, fuels, selectedModelId]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { message, type, id }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const handleUpdateTaxRates = (newRates: TaxRates) => {
    setTaxRates(newRates);
    setInvoiceData(prev => ({ ...prev, impostos: { ...prev.impostos, ...newRates } }));
  };

  const handleLoadModel = (id: string) => {
    const model = db.getModelById(id);
    if (!model) return;
    const prevInitial = isInitialLoad.current;
    isInitialLoad.current = true;
    setPostoData({ ...BLANK_POSTO, ...model.postoData });
    setPrices(model.prices || []);
    setTaxRates({ ...DEFAULT_TAX_RATES, ...(model.taxRates || {}) });
    setFuels(model.fuels || []);
    setInvoiceData({ ...BLANK_INVOICE, ...model.invoiceData });
    setSelectedModelId(id);
    db.saveLastActiveId(id);
    setTimeout(() => { isInitialLoad.current = prevInitial; }, 50);
  };

  const handleSaveModel = async () => {
    setIsSaving(true);
    try {
      const currentId = selectedModelId || Date.now().toString();
      const name = selectedModelId ? (savedModels.find(m => m.id === currentId)?.name || 'Modelo') : `Modelo ${new Date().toLocaleTimeString()}`;
      const modelToSave: SavedModel = { id: currentId, name, updatedAt: new Date().toISOString(), postoData, prices, taxRates, invoiceData, fuels };
      const updatedList = db.saveOrUpdateModel(modelToSave);
      setSavedModels(updatedList);
      setSelectedModelId(currentId);
      db.saveLastActiveId(currentId);
      showToast(selectedModelId ? "Alterações sincronizadas!" : "Modelo criado e salvo!", "success");
    } catch (error) {
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
    showToast("Modelo removido do banco.", "info");
  };

  const handleRenameModel = (id: string, newName: string) => {
     const model = savedModels.find(m => m.id === id);
     if (model) {
        const updated = { ...model, name: newName };
        setSavedModels(db.saveOrUpdateModel(updated));
        showToast("Nome atualizado!", "success");
     }
  };

  const handleNewModel = () => {
    isInitialLoad.current = true;
    setSelectedModelId('');
    setPostoData({ ...BLANK_POSTO });
    setInvoiceData({ ...BLANK_INVOICE });
    setFuels([]);
    setPrices([]);
    setTaxRates({ ...DEFAULT_TAX_RATES });
    setTimeout(() => { isInitialLoad.current = false; }, 50);
  };

  const handleResetAll = () => {
    const defaults = db.resetModels();
    setSavedModels(defaults);
    handleLoadModel(defaults[0].id);
    showToast("Banco de dados restaurado.", "success");
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
    showToast(`Backup importado com sucesso.`, "success");
  };

  const handleDeleteLayout = (id: string) => {
     if (customLayouts.length <= 1) return;
     const newLayouts = customLayouts.filter(l => l.id !== id);
     db.saveLayouts(newLayouts);
     setCustomLayouts(newLayouts);
     if (postoData.activeLayoutId === id) {
        setPostoData(prev => ({ ...prev, activeLayoutId: newLayouts[0].id }));
     }
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