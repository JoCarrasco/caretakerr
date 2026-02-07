import api from './api';
import { InventoryItem } from '../types';

export interface InventoryTransactionData {
    type: 'in' | 'out';
    quantity: number;
    notes?: string;
}

export const inventoryService = {
    async getAll(): Promise<InventoryItem[]> {
        const response = await api.get<InventoryItem[]>('/inventory');
        return response.data;
    },

    async getLowStock(): Promise<InventoryItem[]> {
        const response = await api.get<InventoryItem[]>('/inventory/low-stock');
        return response.data;
    },

    async getById(id: number): Promise<InventoryItem> {
        const response = await api.get<InventoryItem>(`/inventory/${id}`);
        return response.data;
    },

    async create(data: Partial<InventoryItem>): Promise<InventoryItem> {
        const response = await api.post<InventoryItem>('/inventory', data);
        return response.data;
    },

    async update(id: number, data: Partial<InventoryItem>): Promise<InventoryItem> {
        const response = await api.patch<InventoryItem>(`/inventory/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/inventory/${id}`);
    },

    async recordTransaction(id: number, data: InventoryTransactionData): Promise<InventoryItem> {
        const response = await api.post<InventoryItem>(`/inventory/${id}/transaction`, data);
        return response.data;
    },
};
