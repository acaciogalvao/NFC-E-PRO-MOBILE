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
   * Prioriza dados salvos; apenas retorna os padrões do código se o storage estiver limpo.
   */
  getAllModels(): SavedModel[] {
    try {
      const item = localStorage.getItem(LOCAL_STORAGE_KEY_MODELS);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      
      // Se não houver dados, inicializa com os padrões
      const defaults = [ICCAR_DEFAULT_MODEL, GUIMARAES_DEFAULT_MODEL, ALMEIDA_DEFAULT_MODEL];
      this.saveModels(defaults);
      return defaults;
    } catch (error) {
      console.error("Erro crítico ao ler modelos do storage local:", error);
      return [ICCAR_DEFAULT_MODEL, GUIMARAES_DEFAULT_MODEL, ALMEIDA_DEFAULT_MODEL];
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

  /**
   * Salva ou atualiza um modelo. 
   * Mantém a integridade do banco local substituindo apenas o item correspondente pelo ID.
   */
  saveOrUpdateModel(model: SavedModel): SavedModel[] {
    const models = this.getAllModels();
    const index = models.findIndex(m => m.id === model.id);
    
    let newModels = [...models];
    const modelToSave = { ...model, updatedAt: new Date().toISOString() };
    
    if (index >= 0) {
      newModels[index] = modelToSave;
    } else {
      // Adiciona novos modelos ao topo da lista
      newModels = [modelToSave, ...newModels];
    }
    
    this.saveModels(newModels);
    return newModels;
  }

  // --- PERSISTÊNCIA DE SESSÃO ---

  saveLastActiveId(id: string): void {
    if (!id) return;
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_ID, id);
  }

  getLastActiveId(): string | null {
    return localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_ID);
  }

  /**
   * Restaura o banco de dados local para o estado original do sistema.
   */
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