import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;

    if (user) {
      try {
        const idToken = await user.getIdToken();
        config.headers.Authorization = `Bearer ${idToken}`;
      } catch (error) {
        console.error('Failed to get Firebase ID token:', error);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('Authentication expired or invalid.');
    }

    return Promise.reject(error);
  }
);

export default API;
