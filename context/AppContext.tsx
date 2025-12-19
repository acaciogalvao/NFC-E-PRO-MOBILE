
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { PostoData, InvoiceData, FuelItem, PriceItem, SavedModel, LayoutConfig, TaxRates } from '../types';
import { db } from '../services/storage';
import { api } from '../services/api';
import { BLANK_INVOICE, BLANK_POSTO } from '../utils/constants';

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
  handleSyncFromCloud: () => Promise<void>;
  isSaving: boolean;
  isSyncing: boolean;
  notifications: { message: string; type: 'success' | 'error' | 'info'; id: number }[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextData>({} as AppContextData);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notifications, setNotifications] = useState<{ message: string; type: 'success' | 'error' | 'info'; id: number }[]>([]);
  
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [postoData, setPostoData] = useState<PostoData>(BLANK_POSTO);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(BLANK_INVOICE);
  const [fuels, setFuels] = useState<FuelItem[]>([]);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRates>(DEFAULT_TAX_RATES);

  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [customLayouts, setCustomLayouts] = useState<LayoutConfig[]>([]);

  const isInitialMount = useRef(true);

  useEffect(() => {
    const init = async () => {
      const localModels = db.getAllModels();
      const layouts = db.getAllLayouts();
      setSavedModels(localModels);
      setCustomLayouts(layouts);

      const lastId = db.getLastActiveId();
      if (lastId && localModels.find(m => m.id === lastId)) {
        handleLoadModel(lastId);
      } else if (localModels.length > 0) {
        handleLoadModel(localModels[0].id);
      }

      await handleSyncFromCloud(true);
    };

    if (isInitialMount.current) {
      init();
      isInitialMount.current = false;
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { message, type, id }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const handleSyncFromCloud = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const cloudModels = await api.getModels();
      if (cloudModels) {
        const localModels = db.getAllModels();
        const merged = [...localModels];
        
        cloudModels.forEach(cm => {
          const index = merged.findIndex(m => m.id === cm.id || (m.name === cm.name && m.id.includes('user_')));
          if (index !== -1) {
            merged[index] = cm;
          } else {
            merged.push(cm);
          }
        });

        db.saveModels(merged);
        setSavedModels(merged);
        
        if (!silent) showToast("Base de dados sincronizada!", "success");
      }
    } catch (error) {
      if (!silent) showToast("Erro ao conectar com MongoDB.", "error");
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  const handleSaveModel = async () => {
    if (!postoData.razaoSocial) {
      showToast("Dê um nome ao posto antes de salvar.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const currentModel = savedModels.find(m => m.id === selectedModelId);
      const modelToSave: SavedModel = {
        id: selectedModelId || `user_${Date.now()}`,
        name: currentModel?.name || postoData.razaoSocial,
        updatedAt: new Date().toISOString(),
        postoData,
        prices,
        taxRates,
        invoiceData,
        fuels
      };

      // Tenta salvar na nuvem primeiro
      const savedInCloud = await api.saveModel(modelToSave);
      
      // Se salvou na nuvem, usamos o objeto retornado (que tem o ID definitivo do MongoDB)
      const finalModel = savedInCloud || modelToSave;

      // Se o ID mudou (de temporário para definitivo), removemos o rascunho antigo
      if (selectedModelId && selectedModelId !== finalModel.id) {
        db.deleteModel(selectedModelId);
      }

      const updatedList = db.saveOrUpdateModel(finalModel);
      setSavedModels(updatedList);
      setSelectedModelId(finalModel.id);
      db.saveLastActiveId(finalModel.id);

      showToast("Dados guardados no MongoDB!", "success");
    } catch (error) {
      showToast("Erro ao persistir dados.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadModel = (id: string) => {
    const model = db.getModelById(id);
    if (!model) return;
    
    setPostoData(model.postoData);
    setPrices(model.prices || []);
    setTaxRates(model.taxRates || DEFAULT_TAX_RATES);
    setFuels(model.fuels || []);
    setInvoiceData({ ...BLANK_INVOICE, ...model.invoiceData });
    setSelectedModelId(id);
    db.saveLastActiveId(id);
  };

  const handleNewModel = () => {
    setSelectedModelId('');
    setPostoData(BLANK_POSTO);
    setInvoiceData(BLANK_INVOICE);
    setFuels([]);
    setPrices([]);
    setTaxRates(DEFAULT_TAX_RATES);
    showToast("Novo rascunho iniciado", "info");
  };

  const handleDeleteModel = async (id: string) => {
    try {
      await api.deleteModel(id);
      const newList = db.deleteModel(id);
      setSavedModels(newList);
      if (id === selectedModelId) handleNewModel();
      showToast("Modelo removido permanentemente.", "info");
    } catch {
      showToast("Erro ao deletar da nuvem.", "error");
    }
  };

  const handleRenameModel = async (id: string, newName: string) => {
    const model = savedModels.find(m => m.id === id);
    if (model) {
      const updated = { ...model, name: newName, updatedAt: new Date().toISOString() };
      await api.saveModel(updated);
      const list = db.saveOrUpdateModel(updated);
      setSavedModels(list);
      showToast("Título atualizado!", "success");
    }
  };

  const handleResetAll = () => {
    const defaults = db.resetModels();
    setSavedModels(defaults);
    handleLoadModel(defaults[0].id);
    showToast("Configurações padrão restauradas.", "success");
  };

  const handleImportBackup = (models: SavedModel[], layouts?: LayoutConfig[]) => {
    db.saveModels(models);
    if (layouts) {
       db.saveLayouts(layouts);
       setCustomLayouts(layouts);
    }
    setSavedModels(models);
    showToast("Backup importado com sucesso.", "success");
  };

  const handleDeleteLayout = (id: string) => {
     const newLayouts = customLayouts.filter(l => l.id !== id);
     db.saveLayouts(newLayouts);
     setCustomLayouts(newLayouts);
  };

  const handleUpdateTaxRates = (rates: TaxRates) => {
    setTaxRates(rates);
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
      handleSyncFromCloud,
      isSaving, isSyncing, notifications, showToast
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
