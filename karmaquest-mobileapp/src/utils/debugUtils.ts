/**
 * Debug Utilities for KarmaQuest Mobile App
 * 
 * These utilities help diagnose and fix common issues during development
 */

import { storage } from '../utils';
import { Alert } from 'react-native';

export const debugUtils = {
  /**
   * Clear all stored tokens and user data
   * Use this if you're stuck in an authentication loop
   */
  async clearAllData() {
    try {
      await storage.clear();
      console.log('✅ All app data cleared successfully!');
      Alert.alert(
        'Data Cleared',
        'All app data has been cleared. Please restart the app.',
        [{ text: 'OK' }]
      );
      return true;
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      Alert.alert(
        'Error',
        'Failed to clear app data. Please try restarting the app manually.',
        [{ text: 'OK' }]
      );
      return false;
    }
  },

  /**
   * Clear only authentication tokens
   * Use this if you want to log out completely
   */
  async clearAuthTokens() {
    try {
      await storage.clearTokens();
      console.log('✅ Auth tokens cleared successfully!');
      Alert.alert(
        'Logged Out',
        'You have been logged out. Please restart the app.',
        [{ text: 'OK' }]
      );
      return true;
    } catch (error) {
      console.error('❌ Error clearing auth tokens:', error);
      return false;
    }
  },

  /**
   * Log current authentication status
   */
  async logAuthStatus() {
    try {
      const accessToken = await storage.getAccessToken();
      const refreshToken = await storage.getRefreshToken();
      
      console.log('=== Auth Status ===');
      console.log('Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'None');
      console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'None');
      console.log('==================');
      
      return {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
      };
    } catch (error) {
      console.error('Error checking auth status:', error);
      return {
        hasAccessToken: false,
        hasRefreshToken: false,
      };
    }
  },

  /**
   * Test API connectivity
   */
  async testAPIConnection(apiService: any) {
    try {
      console.log('Testing API connection...');
      
      // Try health check or profile endpoint
      const response = await apiService.getUserProfile();
      
      if (response.success) {
        console.log('✅ API connection successful!');
        Alert.alert('API Status', 'Connected successfully!', [{ text: 'OK' }]);
        return true;
      } else {
        console.log('❌ API returned error:', response.error);
        Alert.alert('API Status', `Error: ${response.error}`, [{ text: 'OK' }]);
        return false;
      }
    } catch (error) {
      console.error('❌ API connection failed:', error);
      Alert.alert('API Status', 'Connection failed. Check your internet and backend server.', [{ text: 'OK' }]);
      return false;
    }
  },

  /**
   * Enable verbose console logging
   */
  enableVerboseLogging() {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      const timestamp = new Date().toISOString();
      originalLog(`[${timestamp}] [LOG]`, ...args);
    };

    console.warn = (...args: any[]) => {
      const timestamp = new Date().toISOString();
      originalWarn(`[${timestamp}] [WARN]`, ...args);
    };

    console.error = (...args: any[]) => {
      const timestamp = new Date().toISOString();
      originalError(`[${timestamp}] [ERROR]`, ...args);
    };

    console.log('✅ Verbose logging enabled');
  },
};

export default debugUtils;
