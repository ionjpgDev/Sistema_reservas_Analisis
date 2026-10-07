import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json; charset=utf-8'
    }
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {

        const token = localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response: AxiosResponse) => {

        return response;
    },
    (error: AxiosError) => {

        const esLogin = error.config?.url?.includes('/auth/login');
        if (error.response?.status === 401 && !esLogin) {
            console.warn("La sesión ha expirado o es inválida (Interceptado por api.ts)");

            localStorage.removeItem('token');

            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;