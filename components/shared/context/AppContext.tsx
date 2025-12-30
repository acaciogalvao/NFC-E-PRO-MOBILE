
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { PostoData, InvoiceData, FuelItem, PriceItem, SavedModel, LayoutConfig, TaxRates } from '../types';
import { db } from '../../../lib/services/storage';
import { api } from '../../../lib/services/api';
import { BLANK_INVOICE, BLANK_POSTO } from '../constants';

const DEFAULT_TAX_RATES: TaxRates = { federal: '0,0000', estadual: '0,0000', municipal: '0,0000' };
const LOCAL_STORAGE_DRAFT_KEY = 'nfce_pro_active_draft_v1';

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
  handleSaveLayout: (layout: LayoutConfig) => void;
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
      try {
        const localModels = db.getAllModels() || [];
        const layouts = db.getAllLayouts() || [];
        setSavedModels(localModels);
        setCustomLayouts(layouts);

        const savedDraft = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          if (draft.postoData) setPostoData({ ...BLANK_POSTO, ...draft.postoData });
          if (draft.invoiceData) {
            setInvoiceData({ 
              ...BLANK_INVOICE, 
              ...draft.invoiceData,
              impostos: { ...BLANK_INVOICE.impostos, ...(draft.invoiceData.impostos || {}) }
            });
          }
          setFuels(Array.isArray(draft.fuels) ? draft.fuels : []);
          setPrices(Array.isArray(draft.prices) ? draft.prices : []);
          if (draft.taxRates) setTaxRates({ ...DEFAULT_TAX_RATES, ...(draft.taxRates || {}) });
          setSelectedModelId(draft.selectedModelId || '');
        } else {
          const lastId = db.getLastActiveId();
          if (lastId && localModels.find(m => m.id === lastId)) {
            handleLoadModel(lastId);
          } else if (localModels.length > 0) {
            handleLoadModel(localModels[0].id);
          }
        }
      } catch (e) {
        console.error("Erro na inicialização:", e);
      }
      await handleSyncFromCloud(true);
    };

    if (isInitialMount.current) {
      init();
      isInitialMount.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isInitialMount.current) {
      const draft = { postoData, invoiceData, fuels, prices, taxRates, selectedModelId };
      localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(draft));
    }
  }, [postoData, invoiceData, fuels, prices, taxRates, selectedModelId]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...(prev || []), { message, type, id }]);
    setTimeout(() => setNotifications(prev => (prev || []).filter(n => n.id !== id)), 3000);
  };

  const handleSyncFromCloud = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const cloudModels = await api.getModels();
      if (Array.isArray(cloudModels)) {
        const localModels = db.getAllModels() || [];
        const merged = [...localModels];
        cloudModels.forEach(cm => {
          const index = merged.findIndex(m => m.id === cm.id);
          if (index !== -1) merged[index] = cm;
          else merged.push(cm);
        });
        db.saveModels(merged);
        setSavedModels(merged);
        if (!silent) showToast("Cloud sincronizada", "success");
      }
    } catch (error) {
      if (!silent) showToast("Erro de rede", "error");
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  const handleSaveModel = async () => {
    if (!postoData.razaoSocial) {
      showToast("Razão Social é obrigatória", "error");
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
      const savedInCloud = await api.saveModel(modelToSave);
      const finalModel = savedInCloud || modelToSave;
      const updatedList = db.saveOrUpdateModel(finalModel);
      setSavedModels(updatedList || []);
      setSelectedModelId(finalModel.id);
      db.saveLastActiveId(finalModel.id);
      showToast("Salvo com sucesso!", "success");
    } catch (error) {
      showToast("Erro ao salvar", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadModel = (id: string) => {
    const model = db.getModelById(id);
    if (!model) return;
    setPostoData({ ...BLANK_POSTO, ...model.postoData });
    setPrices(Array.isArray(model.prices) ? model.prices : []);
    const rates = { ...DEFAULT_TAX_RATES, ...(model.taxRates || {}) };
    setTaxRates(rates);
    setFuels(Array.isArray(model.fuels) ? model.fuels : []);
    setInvoiceData({ 
      ...BLANK_INVOICE, 
      ...model.invoiceData,
      impostos: { ...rates, ...(model.invoiceData?.impostos || {}) }
    });
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
    localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
    showToast("Novo rascunho limpo", "info");
  };

  const handleDeleteModel = async (id: string) => {
    await api.deleteModel(id);
    const newList = db.deleteModel(id) || [];
    setSavedModels(newList);
    if (id === selectedModelId) handleNewModel();
  };

  const handleRenameModel = async (id: string, newName: string) => {
    const model = (savedModels || []).find(m => m.id === id);
    if (model) {
      const updated = { ...model, name: newName };
      await api.saveModel(updated);
      setSavedModels(db.saveOrUpdateModel(updated) || []);
    }
  };

  const handleResetAll = () => {
    const defaults = db.resetModels() || [];
    setSavedModels(defaults);
    if (defaults.length > 0) handleLoadModel(defaults[0].id);
  };

  const handleImportBackup = (models: SavedModel[], layouts?: LayoutConfig[]) => {
    const validModels = Array.isArray(models) ? models : [];
    db.saveModels(validModels);
    if (Array.isArray(layouts)) {
       db.saveLayouts(layouts);
       setCustomLayouts(layouts);
    }
    setSavedModels(validModels);
  };

  const handleDeleteLayout = (id: string) => {
     const newLayouts = (customLayouts || []).filter(l => l.id !== id);
     db.saveLayouts(newLayouts);
     setCustomLayouts(newLayouts);
  };

  const handleSaveLayout = (layout: LayoutConfig) => {
    const index = (customLayouts || []).findIndex(l => l.id === layout.id);
    let newLayouts = [...(customLayouts || [])];
    if (index >= 0) newLayouts[index] = layout;
    else newLayouts = [layout, ...newLayouts];
    db.saveLayouts(newLayouts);
    setCustomLayouts(newLayouts);
  };

  const handleUpdateTaxRates = (rates: TaxRates) => {
    setTaxRates(rates);
    setInvoiceData(prev => ({
      ...prev,
      impostos: { ...rates }
    }));
  };

  return (
    <AppContext.Provider value={{
      postoData, setPostoData, invoiceData, setInvoiceData, fuels, setFuels,
      prices, setPrices, taxRates, setTaxRates, savedModels, customLayouts,
      selectedModelId, setSelectedModelId, handleLoadModel, handleSaveModel,
      handleDeleteModel, handleRenameModel, handleNewModel, handleResetAll,
      handleImportBackup, handleDeleteLayout, handleSaveLayout, handleUpdateTaxRates,
      handleSyncFromCloud, isSaving, isSyncing, notifications, showToast
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
