import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

// Storage utilities
export const storage = {
  async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error saving to storage:', error);
      throw error;
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from storage:', error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },

  // Token management
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await this.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  },

  async getAccessToken(): Promise<string | null> {
    return await this.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return await this.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async clearTokens(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await this.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
};

// Validation utilities
export const validation = {
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPassword(password: string): boolean {
    // At least 8 characters, one uppercase, one lowercase, one number
    return password.length >= 8 &&
           /[a-z]/.test(password) &&
           /[A-Z]/.test(password) &&
           /\d/.test(password);
  },

  isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(phone);
  },

  validateRegisterData(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    if (!data.email) {
      errors.email = 'Email is required';
    } else if (!this.isValidEmail(data.email)) {
      errors.email = 'Invalid email format';
    }

    if (!data.password) {
      errors.password = 'Password is required';
    } else if (!this.isValidPassword(data.password)) {
      errors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }

    if (!data.first_name) {
      errors.first_name = 'First name is required';
    }

    if (!data.last_name) {
      errors.last_name = 'Last name is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

// Date formatting utilities
export const dateUtils = {
  formatDate(date: Date | string | null | undefined, format: string = 'MMM DD, YYYY'): string {
    if (!date) {
      return 'N/A';
    }
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      return 'N/A';
    }
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    
    if (format === 'MMM DD, YYYY') {
      return `${month} ${day}, ${year}`;
    } else if (format === 'YYYY-MM-DD') {
      return `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    
    return d.toLocaleDateString();
  },

  formatTime(date: Date | string | null | undefined): string {
    if (!date) {
      return 'N/A';
    }
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      return 'N/A';
    }
    
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  },

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  },

  getWeekDates(startDate?: Date): Date[] {
    const start = startDate || new Date();
    const dates: Date[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  },

  isToday(date: Date | string | null | undefined): boolean {
    if (!date) {
      return false;
    }
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      return false;
    }
    
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  },
};

// Export formatDuration as standalone function for convenience
export const formatDuration = dateUtils.formatDuration;

// Calculation utilities
export const calculateCalories = (exerciseType: string, reps: number, duration?: number): number => {
  const caloriesPerRep: Record<string, number> = {
    squat: 0.32,
    pushup: 0.29,
    lunge: 0.30,
    deadlift: 0.45,
  };

  if (exerciseType === 'plank' && duration) {
    return duration * 0.10; // calories per second
  }

  return (caloriesPerRep[exerciseType] || 0.3) * reps;
};

export const calculateBMR = (weight: number, height: number, age: number, gender: string): number => {
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

export const calculateTDEE = (bmr: number, activityLevel: string): number => {
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  return bmr * (activityMultipliers[activityLevel] || 1.2);
};

// String utilities
export const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toFixed(decimals);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default {
  storage,
  validation,
  dateUtils,
  calculateCalories,
  calculateBMR,
  calculateTDEE,
  formatNumber,
  truncateText,
  capitalizeFirst,
  groupBy,
  debounce,
};
