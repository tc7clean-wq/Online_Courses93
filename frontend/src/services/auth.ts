import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  avatar?: string;
  profile?: {
    bio?: string;
    title?: string;
    website?: string;
    location?: string;
    interests?: string[];
  };
  stats?: {
    coursesEnrolled: number;
    coursesCompleted: number;
    totalStudyTime: number;
    certificatesEarned: number;
  };
  preferences?: {
    emailNotifications?: {
      courseUpdates: boolean;
      promotions: boolean;
      newFeatures: boolean;
    };
    privacy?: {
      showProfile: boolean;
      showProgress: boolean;
    };
  };
  profileCompletion?: number;
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'student';
}

export interface UpdateProfileData {
  name?: string;
  avatar?: string;
  profile?: {
    bio?: string;
    title?: string;
    website?: string;
    location?: string;
    interests?: string[];
  };
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}


class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(userData: RegisterData): Promise<LoginResponse> {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.user;
  }

  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await api.put('/auth/profile', data);
    return response.data.user;
  }

  async changePassword(data: ChangePasswordData): Promise<void> {
    await api.put('/auth/password', data);
  }

  async updatePreferences(preferences: any): Promise<void> {
    await api.put('/auth/preferences', preferences);
  }


  async refreshToken(): Promise<{ token: string }> {
    const response = await api.post('/auth/refresh');
    return response.data;
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Check if token is expired (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch {
      return null;
    }
  }

  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    if (!userRole) return false;

    // Admin has access to everything
    if (userRole === 'admin') return true;

    return userRole === role;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }
}

export const authService = new AuthService();
export default authService;