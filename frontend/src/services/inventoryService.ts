import api from './api';
import { InventoryItem } from '../types';

export interface InventoryItemInput {
    name: string;
    category: 'medicine' | 'supply';
    quantity: number;
    unit: string;
    min_stock_level?: number;
    expiry_date?: string;
    location?: string;
    notes?: string;
}

export interface AIExtraction {
    name: string | null;
    category: 'medicine' | 'supply' | null;
    quantity: number | null;
    unit: string | null;
    expiry_date: string | null;
    manufacturer: string | null;
    description: string | null;
    warnings: string | null;
    confidence: number;
}

export interface AnalyzeImageResponse {
    success: boolean;
    data: AIExtraction;
    message: string;
}

const inventoryService = {
    // Get all inventory items
    getAll: async (): Promise<InventoryItem[]> => {
        const response = await api.get('/inventory');
        return response.data;
    },

    // Get low stock items
    getLowStock: async (): Promise<InventoryItem[]> => {
        const response = await api.get('/inventory/low-stock');
        return response.data;
    },

    // Get single item
    getById: async (id: string): Promise<InventoryItem> => {
        const response = await api.get(`/inventory/${id}`);
        return response.data;
    },

    // Create new item
    create: async (item: InventoryItemInput): Promise<InventoryItem> => {
        const response = await api.post('/inventory', item);
        return response.data;
    },

    // Update item
    update: async (id: string, updates: Partial<InventoryItemInput>): Promise<InventoryItem> => {
        const response = await api.patch(`/inventory/${id}`, updates);
        return response.data;
    },

    // Delete item
    delete: async (id: string): Promise<void> => {
        await api.delete(`/inventory/${id}`);
    },

    // Record transaction
    recordTransaction: async (
        id: string,
        type: 'in' | 'out',
        quantity: number,
        notes?: string
    ): Promise<InventoryItem> => {
        const response = await api.post(`/inventory/${id}/transaction`, {
            type,
            quantity,
            notes,
        });
        return response.data;
    },

    // Analyze image with AI
    analyzeImage: async (imageFile: File): Promise<AnalyzeImageResponse> => {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await api.post('/inventory/analyze-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

export default inventoryService;
