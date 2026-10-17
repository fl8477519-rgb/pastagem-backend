import type { CreateFarmInput, CreatePaddockInput, Farm, Paddock } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Erro ${response.status} ao comunicar com a API.`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getFarms: () => request<Farm[]>('/farms'),
  createFarm: (farm: CreateFarmInput) =>
    request<Farm>('/farms', {
      method: 'POST',
      body: JSON.stringify(farm),
    }),
  getPaddocksByFarm: (farmId: string) =>
    request<Paddock[]>(`/paddocks/farm/${encodeURIComponent(farmId)}`),
  createPaddock: (paddock: CreatePaddockInput) =>
    request<Paddock>('/paddocks', {
      method: 'POST',
      body: JSON.stringify(paddock),
    }),
};
