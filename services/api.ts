import { SavedModel } from '../types';
import { API_BASE_URL } from '../utils/constants';

class ApiService {
  private async fetchWithTimeout(url: string, options: RequestInit, timeout = 5000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  async getModels(): Promise<SavedModel[]> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/models`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error('Erro ao buscar modelos na nuvem');
      return await response.json();
    } catch (error) {
      console.warn('API Offline ou erro de rede ao buscar modelos:', error);
      return []; // Retorna lista vazia em caso de erro de rede
    }
  }

  async saveModel(model: SavedModel): Promise<SavedModel | null> {
    try {
      // Verifica se o ID é do MongoDB (geralmente 24 caracteres hex) ou se é um rascunho local
      const isNew = model.id.includes('user_') || model.id.includes('_fixo') || model.id.length < 24;
      
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? `${API_BASE_URL}/models` : `${API_BASE_URL}/models/${model.id}`;

      const response = await this.fetchWithTimeout(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model),
      });

      if (!response.ok) throw new Error('Erro ao salvar na nuvem');
      return await response.json();
    } catch (error) {
      console.warn('API Offline ou erro de rede ao salvar modelo:', error);
      return null;
    }
  }

  async deleteModel(id: string): Promise<boolean> {
    try {
      // Só tenta deletar se o ID não for de um modelo fixo ou local
      if (id.includes('_fixo') || id.includes('user_')) return true;

      const response = await this.fetchWithTimeout(`${API_BASE_URL}/models/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.warn('API Offline ou erro de rede ao deletar modelo:', error);
      return false;
    }
  }
}

export const api = new ApiService();