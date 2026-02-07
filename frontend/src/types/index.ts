export interface User {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'caretaker';
    phone?: string;
    organizationId: number;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'caretaker';
    phone?: string;
}

export interface Resident {
    id: number;
    name: string;
    dateOfBirth?: string;
    roomNumber?: string;
    admissionDate?: string;
    emergencyContact?: string;
    notes?: string;
}

export interface InventoryItem {
    id: number;
    name: string;
    category: 'medicine' | 'supply';
    quantity: number;
    unit: string;
    minStockLevel: number;
    expiryDate?: string;
    location?: string;
    notes?: string;
    version: number;
}

export interface Schedule {
    id: number;
    caretakerId: number;
    caretakerName?: string;
    startTime: string;
    endTime: string;
    shiftType?: string;
    status: string;
    notes?: string;
}

export interface Medication {
    id: number;
    residentId: number;
    residentName?: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    instructions?: string;
}

export interface Task {
    id: number;
    title: string;
    description?: string;
    assignedTo?: number;
    assignedToName?: string;
    residentId?: number;
    dueDate?: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed';
}

export interface Activity {
    id: number;
    title: string;
    description?: string;
    residentIds: number[];
    scheduledAt: string;
    duration?: number;
    ledBy?: number;
    ledByName?: string;
    status: string;
}
