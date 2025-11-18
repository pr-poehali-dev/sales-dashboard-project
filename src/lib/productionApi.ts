import { ProductionTask, Settings } from '@/types/production';

const API_URL = 'https://functions.poehali.dev/dadab167-f1e7-4e0b-9b38-7005558f26ee';

export const productionApi = {
  async getSettings(): Promise<Settings> {
    const response = await fetch(`${API_URL}?action=settings`);
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  },

  async updateSettings(settings: Settings): Promise<void> {
    const response = await fetch(`${API_URL}?action=settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update settings error:', response.status, errorText);
      throw new Error(`Failed to update settings: ${response.status} ${errorText}`);
    }
  },

  async getTasks(archived = false): Promise<ProductionTask[]> {
    const response = await fetch(`${API_URL}?action=tasks&archived=${archived}`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  async createTask(task: Omit<ProductionTask, 'id'>): Promise<{ id: string }> {
    const response = await fetch(`${API_URL}?action=tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  async updateTask(id: string, task: Partial<ProductionTask>): Promise<void> {
    const response = await fetch(`${API_URL}?action=tasks&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error('Failed to update task');
  },
};