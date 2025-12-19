
import { SavedModel, LayoutConfig } from '../types';
import { 
  LOCAL_STORAGE_KEY_MODELS, 
  LOCAL_STORAGE_KEY_LAYOUTS,
  LOCAL_STORAGE_KEY_ACTIVE_ID,
  DEFAULT_LAYOUTS,
  ALMEIDA_DEFAULT_MODEL,
  GUIMARAES_DEFAULT_MODEL,
  ICCAR_DEFAULT_MODEL
} from '../utils/constants';

class StorageService {
  /**
   * Obtém todos os modelos do localStorage.
   * Se os modelos padrão estiverem desatualizados, faz o patch do CEP.
   */
  getAllModels(): SavedModel[] {
    try {
      const item = localStorage.getItem(LOCAL_STORAGE_KEY_MODELS);
      let models: SavedModel[] = [];

      if (item) {
        models = JSON.parse(item);
      }
      
      if (!Array.isArray(models) || models.length === 0) {
        models = [ALMEIDA_DEFAULT_MODEL, GUIMARAES_DEFAULT_MODEL, ICCAR_DEFAULT_MODEL];
        this.saveModels(models);
        return models;
      }

      // Patch de segurança: Garante que o modelo Almeida tenha o CEP mesmo se já estiver no storage
      const almeidaIndex = models.findIndex(m => m.id === 'almeida_modelo_fixo');
      if (almeidaIndex !== -1 && !models[almeidaIndex].postoData.cep) {
        models[almeidaIndex].postoData.cep = ALMEIDA_DEFAULT_MODEL.postoData.cep;
        this.saveModels(models);
      }
      
      return models;
    } catch (error) {
      console.error("Erro crítico ao ler modelos do storage local:", error);
      return [ALMEIDA_DEFAULT_MODEL, GUIMARAES_DEFAULT_MODEL, ICCAR_DEFAULT_MODEL];
    }
  }

  saveModels(models: SavedModel[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_MODELS, JSON.stringify(models));
    } catch (error) {
      console.error("Erro ao persistir modelos no localStorage:", error);
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
    const modelToSave = { ...model, updatedAt: new Date().toISOString() };
    
    if (index >= 0) {
      newModels[index] = modelToSave;
    } else {
      newModels = [modelToSave, ...newModels];
    }
    
    this.saveModels(newModels);
    return newModels;
  }

  saveLastActiveId(id: string): void {
    if (!id) return;
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
}

export const db = new StorageService();
