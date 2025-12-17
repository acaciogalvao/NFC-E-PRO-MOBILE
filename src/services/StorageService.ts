import { SavedModel, LayoutConfig } from '../types';
import { 
  LOCAL_STORAGE_KEY_MODELS, 
  LOCAL_STORAGE_KEY_LAYOUTS,
  DEFAULT_LAYOUTS,
  ALMEIDA_DEFAULT_MODEL,
  GUIMARAES_DEFAULT_MODEL,
  ICCAR_DEFAULT_MODEL
} from '../constants/defaults';

class StorageService {
  // --- MODELOS DE DADOS (DB) ---

  getAllModels(): SavedModel[] {
    try {
      const item = localStorage.getItem(LOCAL_STORAGE_KEY_MODELS);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Se não existir ou estiver vazio, retorna os padrões
      return [ALMEIDA_DEFAULT_MODEL, GUIMARAES_DEFAULT_MODEL, ICCAR_DEFAULT_MODEL];
    } catch (error) {
      console.error("Erro ao ler modelos:", error);
      return [ALMEIDA_DEFAULT_MODEL, GUIMARAES_DEFAULT_MODEL, ICCAR_DEFAULT_MODEL];
    }
  }

  saveModels(models: SavedModel[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_MODELS, JSON.stringify(models));
    } catch (error) {
      console.error("Erro ao salvar modelos:", error);
      throw new Error("Falha ao persistir dados no armazenamento local.");
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
      newModels[index] = model;
    } else {
      newModels = [model, ...newModels];
    }
    
    this.saveModels(newModels);
    return newModels;
  }

  resetModels(): SavedModel[] {
    const defaults = [ALMEIDA_DEFAULT_MODEL, GUIMARAES_DEFAULT_MODEL, ICCAR_DEFAULT_MODEL];
    this.saveModels(defaults);
    return defaults;
  }

  // --- LAYOUTS (VISUAL) ---

  getAllLayouts(): LayoutConfig[] {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LAYOUTS);
      return saved ? JSON.parse(saved) : DEFAULT_LAYOUTS;
    } catch {
      return DEFAULT_LAYOUTS;
    }
  }

  saveLayouts(layouts: LayoutConfig[]): void {
    localStorage.setItem(LOCAL_STORAGE_KEY_LAYOUTS, JSON.stringify(layouts));
  }
}

export const db = new StorageService();