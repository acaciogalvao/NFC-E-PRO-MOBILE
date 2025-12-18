
import { SavedModel, LayoutConfig } from '../types';
import { 
  LOCAL_STORAGE_KEY_MODELS, 
  LOCAL_STORAGE_KEY_LAYOUTS,
  DEFAULT_LAYOUTS,
  ALMEIDA_DEFAULT_MODEL,
  GUIMARAES_DEFAULT_MODEL,
  ICCAR_DEFAULT_MODEL
} from '../constants/defaults';

const LOCAL_STORAGE_KEY_ACTIVE_ID = 'nfce_pro_active_id_v1';

class StorageService {
  // --- MODELOS DE DADOS (DB) ---

  getAllModels(): SavedModel[] {
    try {
      const item = localStorage.getItem(LOCAL_STORAGE_KEY_MODELS);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Se não existir ou estiver vazio, retorna os padrões e já salva no DB local
      const defaults = [ICCAR_DEFAULT_MODEL, GUIMARAES_DEFAULT_MODEL, ALMEIDA_DEFAULT_MODEL];
      this.saveModels(defaults);
      return defaults;
    } catch (error) {
      console.error("Erro ao ler modelos:", error);
      return [ICCAR_DEFAULT_MODEL, GUIMARAES_DEFAULT_MODEL, ALMEIDA_DEFAULT_MODEL];
    }
  }

  saveModels(models: SavedModel[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_MODELS, JSON.stringify(models));
    } catch (error) {
      console.error("Erro ao salvar modelos:", error);
    }
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
    if (index >= 0) {
      newModels[index] = { ...model, updatedAt: new Date().toISOString() };
    } else {
      newModels = [{ ...model, updatedAt: new Date().toISOString() }, ...newModels];
    }
    
    this.saveModels(newModels);
    return newModels;
  }

  // --- PERSISTÊNCIA DE SESSÃO ---

  saveLastActiveId(id: string): void {
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_ID, id);
  }

  getLastActiveId(): string | null {
    return localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_ID);
  }

  resetModels(): SavedModel[] {
    const defaults = [ICCAR_DEFAULT_MODEL, GUIMARAES_DEFAULT_MODEL, ALMEIDA_DEFAULT_MODEL];
    this.saveModels(defaults);
    return defaults;
  }

  // --- LAYOUTS (VISUAL) ---

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
}

export const db = new StorageService();
