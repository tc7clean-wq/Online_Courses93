import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response.data.success ? response : Promise.reject(response.data);
      },
      (error: AxiosError) => {
        const errorData = error.response?.data as any;

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired. Please login again.'));
        }

        // Handle network errors
        if (!error.response) {
          return Promise.reject(new Error('Network error. Please check your connection.'));
        }

        // Handle validation errors
        if (error.response.status === 400 && errorData?.errors) {
          const validationErrors = errorData.errors.map((err: any) => err.msg || err.message).join(', ');
          return Promise.reject(new Error(validationErrors));
        }

        // Handle rate limiting
        if (error.response.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const message = retryAfter
            ? `Too many requests. Please try again in ${retryAfter} seconds.`
            : 'Too many requests. Please try again later.';
          return Promise.reject(new Error(message));
        }

        // Handle server errors
        if (error.response.status >= 500) {
          return Promise.reject(new Error('Server error. Please try again later.'));
        }

        // Handle other errors
        const message = errorData?.message || error.message || 'An unexpected error occurred';
        return Promise.reject(new Error(message));
      }
    );
  }

  // HTTP methods
  async get<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // File upload helper
  async uploadFile<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    const response = await this.client.post(url, formData, config);
    return response.data;
  }

  // URL helpers
  getApiUrl(path: string): string {
    return `${API_BASE_URL}${path}`;
  }

  // Cancel token helpers
  createCancelToken() {
    return axios.CancelToken.source();
  }

  isCancel(error: any): boolean {
    return axios.isCancel(error);
  }

  // Raw client access for special cases
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Create and export the singleton instance
const apiService = new ApiService();
export default apiService;

// Export the class for testing or multiple instances
export { ApiService };