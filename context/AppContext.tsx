
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

  // Inicialização e Sincronização
  useEffect(() => {
    const init = async () => {
      // 1. Carrega o que tem no LocalStorage primeiro para resposta imediata
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

      // 2. Sincroniza com o MongoDB Atlas
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
      if (cloudModels && cloudModels.length > 0) {
        const localModels = db.getAllModels();
        
        // Merge inteligente: A nuvem sempre vence se o ID existir lá
        const merged = [...localModels];
        cloudModels.forEach(cm => {
          const index = merged.findIndex(m => m.id === cm.id);
          if (index !== -1) {
            merged[index] = cm; // Atualiza local com dados do banco
          } else {
            merged.push(cm); // Adiciona novo vindo do banco
          }
        });

        db.saveModels(merged);
        setSavedModels(merged);
        
        // Recarrega o modelo atual se ele foi atualizado
        if (selectedModelId) {
          const updated = merged.find(m => m.id === selectedModelId);
          if (updated) {
             // Atualiza estados sem disparar auto-save circular
             setPostoData(updated.postoData);
             setInvoiceData(updated.invoiceData);
             setFuels(updated.fuels);
             setPrices(updated.prices);
             setTaxRates(updated.taxRates);
          }
        }

        if (!silent) showToast("Dados sincronizados com o MongoDB Atlas!", "success");
      }
    } catch (error) {
      if (!silent) showToast("Erro de conexão com o banco de dados.", "error");
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  const handleSaveModel = async () => {
    if (!postoData.razaoSocial) {
      showToast("Razão Social é obrigatória para salvar.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const currentId = selectedModelId || `user_${Date.now()}`;
      const existing = savedModels.find(m => m.id === currentId);
      
      const modelToSave: SavedModel = {
        id: currentId,
        name: existing?.name || `Modelo ${new Date().toLocaleTimeString()}`,
        updatedAt: new Date().toISOString(),
        postoData,
        prices,
        taxRates,
        invoiceData,
        fuels
      };

      // 1. Salva na Nuvem primeiro (MongoDB Atlas)
      const cloudResult = await api.saveModel(modelToSave);
      
      // 2. Se a nuvem salvou e retornou um novo ID (do MongoDB), usamos ele
      const finalModel = cloudResult || modelToSave;

      // 3. Salva Local
      const updatedList = db.saveOrUpdateModel(finalModel);
      setSavedModels(updatedList);
      setSelectedModelId(finalModel.id);
      db.saveLastActiveId(finalModel.id);

      showToast("Sincronizado com Sucesso!", "success");
    } catch (error) {
      showToast("Erro ao salvar. Verifique sua conexão.", "error");
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
    setInvoiceData(model.invoiceData);
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
    showToast("Novo rascunho", "info");
  };

  const handleDeleteModel = async (id: string) => {
    try {
      await api.deleteModel(id);
      const newList = db.deleteModel(id);
      setSavedModels(newList);
      if (id === selectedModelId) handleNewModel();
      showToast("Modelo removido do banco.", "info");
    } catch {
      showToast("Erro ao deletar do banco.", "error");
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
  };

  const handleImportBackup = (models: SavedModel[], layouts?: LayoutConfig[]) => {
    db.saveModels(models);
    if (layouts) {
       db.saveLayouts(layouts);
       setCustomLayouts(layouts);
    }
    setSavedModels(models);
    showToast("Backup importado.", "success");
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
