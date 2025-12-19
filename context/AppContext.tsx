import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { PostoData, InvoiceData, FuelItem, PriceItem, SavedModel, LayoutConfig, TaxRates } from '../types';
import { db } from '../services/storage';
import { api } from '../services/api';
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

  const isUpdatingState = useRef(false);

  // Inicialização
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

    // Tenta sincronizar silenciosamente no início
    handleSyncFromCloud(true);
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
        const merged = [...localModels];
        
        cloudModels.forEach(cm => {
          const index = merged.findIndex(m => m.id === cm.id);
          if (index === -1) {
            merged.push(cm); // Recupera da nuvem para o local
          } else {
            // Se cloud for mais recente, atualiza local
            if (cm.updatedAt && merged[index].updatedAt && new Date(cm.updatedAt) > new Date(merged[index].updatedAt)) {
              merged[index] = cm;
            }
          }
        });

        db.saveModels(merged);
        setSavedModels(merged);
        if (!silent) showToast(`Sincronizado: ${cloudModels.length} itens recuperados/atualizados`, "success");
      } else if (!silent) {
        showToast("Nenhum dado encontrado na nuvem ou servidor indisponível.", "info");
      }
    } catch (error) {
      if (!silent) showToast("Erro ao sincronizar. Verifique a conexão com o servidor.", "error");
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  const handleUpdateTaxRates = (newRates: TaxRates) => {
    setTaxRates(newRates);
    setInvoiceData(prev => ({ ...prev, impostos: { ...prev.impostos, ...newRates } }));
  };

  const handleLoadModel = (id: string) => {
    const model = db.getModelById(id);
    if (!model) return;
    
    isUpdatingState.current = true;
    setPostoData({ ...BLANK_POSTO, ...model.postoData });
    setPrices(model.prices || []);
    setTaxRates({ ...DEFAULT_TAX_RATES, ...(model.taxRates || {}) });
    setFuels(model.fuels || []);
    setInvoiceData({ ...BLANK_INVOICE, ...model.invoiceData });
    setSelectedModelId(id);
    db.saveLastActiveId(id);

    setTimeout(() => { isUpdatingState.current = false; }, 150);
  };

  const handleSaveModel = async () => {
    if (!postoData.razaoSocial) {
      showToast("Preencha ao menos o nome do posto!", "error");
      return;
    }

    setIsSaving(true);
    try {
      const currentId = selectedModelId || `user_${Date.now()}`;
      const existingModel = savedModels.find(m => m.id === currentId);
      const name = existingModel?.name || `Modelo ${new Date().toLocaleTimeString()}`;
      
      const modelToSave: SavedModel = { 
        id: currentId, 
        name, 
        updatedAt: new Date().toISOString(), 
        postoData, 
        prices, 
        taxRates, 
        invoiceData, 
        fuels 
      };

      // 1. Salva Local (Sempre prioritário e garantido)
      const updatedList = db.saveOrUpdateModel(modelToSave);
      setSavedModels(updatedList);
      setSelectedModelId(currentId);
      db.saveLastActiveId(currentId);
      
      // 2. Tenta salvar na Nuvem (sem bloquear se falhar)
      api.saveModel(modelToSave).then(savedInCloud => {
        if (savedInCloud && savedInCloud.id !== modelToSave.id) {
          // Se a API gerou um ID MongoDB real (_id -> id), sincronizamos o ID local
          const finalList = db.getAllModels().map(m => m.id === currentId ? savedInCloud : m);
          db.saveModels(finalList);
          setSavedModels(finalList);
          setSelectedModelId(savedInCloud.id);
          db.saveLastActiveId(savedInCloud.id);
        }
      }).catch(e => {
        console.warn("Salvamento na nuvem falhou, mas dados locais estão salvos.");
      });
      
      showToast("Dados guardados localmente!", "success");
    } catch (error) {
      showToast("Erro ao gravar localmente.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteModel = async (id: string) => {
    // 1. Deleta localmente
    const newList = db.deleteModel(id);
    setSavedModels(newList);
    
    if (id === selectedModelId) {
      if (newList.length > 0) handleLoadModel(newList[0].id);
      else handleNewModel();
    }
    
    // 2. Tenta deletar na nuvem (opcional)
    api.deleteModel(id).catch(() => {});
    
    showToast("Modelo removido do cache local.", "info");
  };

  const handleRenameModel = async (id: string, newName: string) => {
     const model = savedModels.find(m => m.id === id);
     if (model) {
        const updated = { ...model, name: newName, updatedAt: new Date().toISOString() };
        db.saveOrUpdateModel(updated);
        setSavedModels(prev => prev.map(m => m.id === id ? updated : m));
        api.saveModel(updated).catch(() => {});
        showToast("Título atualizado!", "success");
     }
  };

  const handleNewModel = () => {
    isUpdatingState.current = true;
    setSelectedModelId('');
    setPostoData({ ...BLANK_POSTO });
    setInvoiceData({ ...BLANK_INVOICE });
    setFuels([]);
    setPrices([]);
    setTaxRates({ ...DEFAULT_TAX_RATES });
    setTimeout(() => { isUpdatingState.current = false; }, 150);
    showToast("Novo rascunho iniciado", "info");
  };

  const handleResetAll = () => {
    const defaults = db.resetModels();
    setSavedModels(defaults);
    handleLoadModel(defaults[0].id);
    showToast("Cache local restaurado aos padrões.", "success");
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
    showToast(`${models.length} modelos importados.`, "success");
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
      handleSyncFromCloud,
      isSaving, isSyncing, notifications, showToast
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);