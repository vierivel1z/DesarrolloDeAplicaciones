import axios from 'axios';

// Creamos la instancia apuntando al puerto de tu Laravel local
const api = axios.create({
    baseURL: 'http://localhost:8000/api', 
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Interceptor: Antes de enviar cualquier petición, busca si hay un Token guardado
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('GNB_TOKEN');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;