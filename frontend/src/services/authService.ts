import api from './api';
import { AuthResponse, LoginCredentials, RegisterData } from '../types';

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    async getCurrentUser(): Promise<AuthResponse['user']> {
        const response = await api.get<{ user: AuthResponse['user'] }>('/auth/me');
        return response.data.user;
    },

    async logout(): Promise<void> {
        await api.post('/auth/logout');
    },
};
