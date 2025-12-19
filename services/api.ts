import { SavedModel } from '../types';
import { API_BASE_URL } from '../utils/constants';

class ApiService {
  async getModels(): Promise<SavedModel[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/models`);
      if (!response.ok) throw new Error('Erro ao buscar modelos na nuvem');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  }

  async saveModel(model: SavedModel): Promise<SavedModel | null> {
    try {
      // Verifica se o modelo já existe no banco (IDs que não começam com user_ ou padrões)
      // Se o ID for compatível com MongoDB (24 chars), usamos PUT, senão POST
      const isNew = model.id.includes('user_') || model.id.includes('_fixo');
      
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? `${API_BASE_URL}/models` : `${API_BASE_URL}/models/${model.id}`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model),
      });

      if (!response.ok) throw new Error('Erro ao salvar na nuvem');
      return await response.json();
    } catch (error) {
      console.error('API Save Error:', error);
      return null;
    }
  }

  async deleteModel(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/models/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('API Delete Error:', error);
      return false;
    }
  }
}

export const api = new ApiService();