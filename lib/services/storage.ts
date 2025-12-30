
import { SavedModel, LayoutConfig, PrintLog } from '../../components/shared/types';
import { 
  LOCAL_STORAGE_KEY_MODELS, 
  LOCAL_STORAGE_KEY_LAYOUTS,
  LOCAL_STORAGE_KEY_ACTIVE_ID,
  LOCAL_STORAGE_KEY_HISTORY,
  DEFAULT_LAYOUTS,
  ALMEIDA_DEFAULT_MODEL,
  GUIMARAES_DEFAULT_MODEL,
  ICCAR_DEFAULT_MODEL
} from '../../components/shared/constants';

class StorageService {
  getAllModels(): SavedModel[] {
    try {
      const item = localStorage.getItem(LOCAL_STORAGE_KEY_MODELS);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const defaults = [ALMEIDA_DEFAULT_MODEL, GUIMARAES_DEFAULT_MODEL, ICCAR_DEFAULT_MODEL];
      this.saveModels(defaults);
      return defaults;
    } catch (error) {
      return [ALMEIDA_DEFAULT_MODEL, GUIMARAES_DEFAULT_MODEL, ICCAR_DEFAULT_MODEL];
    }
  }

  saveModels(models: SavedModel[]): void {
    localStorage.setItem(LOCAL_STORAGE_KEY_MODELS, JSON.stringify(models));
  }

  getModelById(id: string): SavedModel | undefined {
    const models = this.getAllModels();
    return models.find(m => m.id === id);
  }

  deleteModel(id: string): SavedModel[] {
    const models = this.getAllModels();
    const newModels = models.filter(m => m.id !== id);
    this.saveModels(newModels);
    return newModels;
  }

  saveOrUpdateModel(model: SavedModel): SavedModel[] {
    const models = this.getAllModels();
    const index = models.findIndex(m => m.id === model.id);
    let newModels = [...models];
    const modelToSave = { ...model, updatedAt: new Date().toISOString() };
    if (index >= 0) newModels[index] = modelToSave;
    else newModels = [modelToSave, ...newModels];
    this.saveModels(newModels);
    return newModels;
  }

  saveLastActiveId(id: string): void {
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_ID, id);
  }

  getLastActiveId(): string | null {
    return localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_ID);
  }

  resetModels(): SavedModel[] {
    const defaults = [ALMEIDA_DEFAULT_MODEL, GUIMARAES_DEFAULT_MODEL, ICCAR_DEFAULT_MODEL];
    this.saveModels(defaults);
    return defaults;
  }

  getAllLayouts(): LayoutConfig[] {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LAYOUTS);
      if (saved) return JSON.parse(saved);
      this.saveLayouts(DEFAULT_LAYOUTS);
      return DEFAULT_LAYOUTS;
    } catch {
      return DEFAULT_LAYOUTS;
    }
  }

  saveLayouts(layouts: LayoutConfig[]): void {
    localStorage.setItem(LOCAL_STORAGE_KEY_LAYOUTS, JSON.stringify(layouts));
  }

  // --- HISTÓRICO DE IMPRESSÃO ---

  getPrintHistory(): PrintLog[] {
    try {
      const item = localStorage.getItem(LOCAL_STORAGE_KEY_HISTORY);
      if (item) {
        return JSON.parse(item);
      }
      return [];
    } catch {
      return [];
    }
  }

  savePrintLog(log: PrintLog): PrintLog[] {
    const history = this.getPrintHistory();
    const newHistory = [log, ...history].slice(0, 100); // Mantém apenas os últimos 100
    localStorage.setItem(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(newHistory));
    return newHistory;
  }

  clearPrintHistory(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEY_HISTORY);
  }
}

export const db = new StorageService();
