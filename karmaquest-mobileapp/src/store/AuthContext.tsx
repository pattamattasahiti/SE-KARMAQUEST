import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserProfile, AuthResponse } from '../types';
import apiService from '../services/api';
import { storage } from '../utils';
import { STORAGE_KEYS } from '../constants';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: 'user' | 'trainer' | 'admin' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'user' | 'trainer' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await storage.getAccessToken();
      if (token) {
        // Try to fetch user data
        const response = await apiService.getUserProfile();
        if (response.success && response.data) {
          const data = response.data as any;
          setUser(data.user);
          setProfile(data.profile);
          setRole(data.user?.role || 'user');
        } else {
          // Token invalid, clear it and don't retry
          console.log('Token invalid, clearing tokens');
          await storage.clearTokens();
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      await storage.clearTokens();
      setUser(null);
      setProfile(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      
      if (response.success && response.data) {
        const authData = response.data as AuthResponse;
        await storage.saveTokens(authData.access_token, authData.refresh_token);
        await storage.setItem(STORAGE_KEYS.USER_DATA, authData.user);
        
        // Store role
        const userRole = (authData as any).role || authData.user?.role || 'user';
        await storage.setItem(STORAGE_KEYS.USER_ROLE, userRole);
        setRole(userRole);
        
        if (authData.profile) {
          await storage.setItem(STORAGE_KEYS.USER_PROFILE, authData.profile);
          setProfile(authData.profile);
        }
        setUser(authData.user);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'An error occurred' };
    }
  };

  const register = async (data: any) => {
    try {
      const response = await apiService.register(data);
      
      if (response.success && response.data) {
        const authData = response.data as AuthResponse;
        await storage.saveTokens(authData.access_token, authData.refresh_token);
        await storage.setItem(STORAGE_KEYS.USER_DATA, authData.user);
        if (authData.profile) {
          await storage.setItem(STORAGE_KEYS.USER_PROFILE, authData.profile);
          setProfile(authData.profile);
        }
        setUser(authData.user);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'An error occurred' };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await storage.clearTokens();
      await storage.removeItem(STORAGE_KEYS.USER_DATA);
      await storage.removeItem(STORAGE_KEYS.USER_PROFILE);
      await storage.removeItem(STORAGE_KEYS.USER_ROLE);
      setUser(null);
      setProfile(null);
      setRole(null);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      const response = await apiService.updateUserProfile(data);
      if (response.success && response.data) {
        const profileData = response.data as any;
        setProfile(profileData.profile);
        await storage.setItem(STORAGE_KEYS.USER_PROFILE, profileData.profile);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const refreshUserData = async () => {
    try {
      const response = await apiService.getUserProfile();
      if (response.success && response.data) {
        const userData = response.data as any;
        setUser(userData.user);
        setProfile(userData.profile);
        await storage.setItem(STORAGE_KEYS.USER_DATA, userData.user);
        await storage.setItem(STORAGE_KEYS.USER_PROFILE, userData.profile);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const value = {
    user,
    profile,
    role,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
