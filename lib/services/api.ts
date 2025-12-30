
import { SavedModel } from '../../components/shared/types';
import { API_BASE_URL } from '../../components/shared/constants';

class ApiService {
  private async fetchWithTimeout(url: string, options: RequestInit, timeout = 5000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  async getModels(): Promise<SavedModel[]> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/models`, { method: 'GET' });
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  }

  async saveModel(model: SavedModel): Promise<SavedModel | null> {
    try {
      const isNew = model.id.includes('user_') || model.id.includes('_fixo') || model.id.length < 24;
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/models${isNew ? '' : '/' + model.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  async deleteModel(id: string): Promise<boolean> {
    try {
      if (id.includes('_fixo') || id.includes('user_')) return true;
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/models/${id}`, { method: 'DELETE' });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const api = new ApiService();
