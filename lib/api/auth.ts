import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  organizationId: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  phone?: string;
  country?: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  subscriptionTier: 'starter' | 'pro' | 'enterprise';
  businessDescription?: string;
  expectedVolume?: string;
  useCase?: string;
  additionalRequirements?: string;
  referralCode?: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface SignupResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    organizationId: string;
    role: string;
  };
  organization: {
    id: string;
    name: string;
  };
  subscription: {
    id: string;
    tier: string;
    status: string;
    trialEndsAt: string | null;
  };
  tokens: AuthTokens;
  stripeOnboardingUrl?: string;
  stripeCheckoutUrl?: string;
  paymentIntentClientSecret?: string;
  customPlanRequested?: boolean;
}

class AuthService {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly USER_KEY = 'user';

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    
    this.saveAuthData(response);
    
    return response;
  }

  async signup(data: SignupData): Promise<SignupResponse> {
    const response = await apiClient.post<SignupResponse>('/auth/signup', data);

    this.saveAuthData(response);

    return response;
  }

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch {
        // Silently handle - user is already logged out locally
      }
    }
    
    this.clearAuthData();
  }

  async refreshTokens(): Promise<AuthTokens | null> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return null;
    }

    try {
      const tokens = await apiClient.post<AuthTokens>('/auth/refresh', {
        refreshToken,
      });
      
      this.saveTokens(tokens);
      
      return tokens;
    } catch (error) {
      this.clearAuthData();
      throw error;
    }
  }

  async checkEmailAvailability(email: string): Promise<{ inUse: boolean }> {
    return await apiClient.post('/auth/check-email', { email });
  }

  async checkPassword(password: string): Promise<{ valid: boolean; errors: string[] }> {
    return await apiClient.post('/auth/check-password', { password });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AuthService.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AuthService.REFRESH_TOKEN_KEY);
  }

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem(AuthService.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  private saveAuthData(response: LoginResponse | SignupResponse): void {
    this.saveTokens(response.tokens);
    this.saveUser(response.user);
  }

  private saveTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(AuthService.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(AuthService.REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  private saveUser(user: User): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(AuthService.USER_KEY, JSON.stringify(user));
  }

  private clearAuthData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(AuthService.ACCESS_TOKEN_KEY);
    localStorage.removeItem(AuthService.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AuthService.USER_KEY);
  }
}

export const authService = new AuthService();