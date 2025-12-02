import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../constants';
import { storage } from '../utils';
import { ApiResponse } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await storage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Don't retry if it's already a refresh-token request or if we've already retried
        if (error.response?.status === 401 &&
          !originalRequest?.url?.includes('/auth/refresh-token') &&
          !originalRequest?._retry) {
          originalRequest._retry = true;

          // Token expired, try to refresh
          try {
            const refreshToken = await storage.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              if (response.success && response.data) {
                const tokens = response.data as any;
                await storage.saveTokens(
                  tokens.access_token,
                  tokens.refresh_token
                );
                // Retry original request
                if (originalRequest) {
                  originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
                  return this.api.request(originalRequest);
                }
              } else {
                // Refresh failed, logout user
                await storage.clearTokens();
              }
            } else {
              // No refresh token, clear tokens
              await storage.clearTokens();
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            await storage.clearTokens();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  private async request<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.request<ApiResponse<T>>({
        method,
        url,
        data,
        ...config,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.message || error.message,
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('post', '/auth/login', { email, password });
  }

  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    date_of_birth?: string;
    gender?: string;
  }) {
    return this.request('post', '/auth/register', data);
  }

  async logout() {
    return this.request('post', '/auth/logout');
  }

  async refreshToken(refreshToken: string) {
    return this.request('post', '/auth/refresh-token', { refresh_token: refreshToken });
  }

  async forgotPassword(email: string) {
    return this.request('post', '/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request('post', '/auth/reset-password', { token, new_password: newPassword });
  }

  // User endpoints
  async getUserProfile() {
    return this.request('get', '/users/profile');
  }

  async updateUserProfile(data: any) {
    return this.request('put', '/users/profile', data);
  }

  async updateUserGoals(data: any) {
    return this.request('put', '/users/profile/goals', data);
  }

  async deleteAccount() {
    return this.request('delete', '/users/account');
  }

  // Workout session endpoints
  async startWorkoutSession(data?: any) {
    return this.request('post', '/workouts/sessions/start', data);
  }

  async updateWorkoutSession(sessionId: string, data: any) {
    return this.request('put', `/workouts/sessions/${sessionId}/update`, data);
  }

  async completeWorkoutSession(sessionId: string, data?: any) {
    return this.request('post', `/workouts/sessions/${sessionId}/complete`, data);
  }

  async completeAIWorkoutSession(sessionId: string, data: {
    video_url: string;
    original_video_url: string;
    total_reps: number;
    duration: number;
    form_score: number;
    form_issues: string[];
    calories_burned: number;
    exercise_type: string;
  }) {
    return this.request('put', `/workouts/sessions/${sessionId}/complete-ai`, data);
  }

  async getWorkoutSession(sessionId: string) {
    return this.request('get', `/workouts/sessions/${sessionId}`);
  }

  async getWorkoutHistory(limit?: number, offset?: number) {
    return this.request('get', '/workouts/sessions/history', undefined, {
      params: { limit, offset },
    });
  }

  async deleteWorkoutSession(sessionId: string) {
    return this.request('delete', `/workouts/sessions/${sessionId}`);
  }

  // Exercise logging endpoints
  async logExercise(sessionId: string, data: any) {
    return this.request('post', `/workouts/sessions/${sessionId}/exercises`, data);
  }

  async getExerciseTypes() {
    return this.request('get', '/workouts/exercises/types');
  }

  async getExerciseHistory(exerciseType: string) {
    return this.request('get', `/workouts/exercises/history/${exerciseType}`);
  }

  // Progress tracking endpoints
  async getProgressSummary() {
    return this.request('get', '/progress/summary');
  }

  async getWeeklyProgress() {
    return this.request('get', '/progress/weekly');
  }

  async getMonthlyProgress() {
    return this.request('get', '/progress/monthly');
  }

  async logWeight(weight: number, date?: string) {
    return this.request('post', '/progress/weight', { weight, date });
  }

  async getWeightHistory() {
    return this.request('get', '/progress/weight/history');
  }

  async logMeasurements(measurements: any, date?: string) {
    return this.request('post', '/progress/measurements', { measurements, date });
  }

  async uploadProgressPhoto(photo: any) {
    return this.request('post', '/progress/photos', photo);
  }

  async getAchievements() {
    return this.request('get', '/progress/achievements');
  }

  // Workout plan endpoints
  async generateWorkoutPlan(preferences?: any) {
    return this.request('post', '/plans/workout/generate', preferences || {});
  }

  async getCurrentWorkoutPlan() {
    return this.request('get', '/plans/workout/current');
  }

  async getWorkoutPlanHistory() {
    return this.request('get', '/plans/workout/history');
  }

  async regenerateWorkoutPlan(planId: string, preferences?: any) {
    return this.request('put', `/plans/workout/${planId}/regenerate`, preferences || {});
  }

  // Meal plan endpoints
  async generateMealPlan(preferences?: any) {
    return this.request('post', '/plans/meal/generate', preferences || {});
  }

  async getCurrentMealPlan() {
    return this.request('get', '/plans/meal/current');
  }

  async getMealPlanHistory() {
    return this.request('get', '/plans/meal/history');
  }

  async customizeMealPlan(planId: string, customizations: any) {
    return this.request('put', `/plans/meal/${planId}/customize`, customizations);
  }

  // Notification endpoints
  async scheduleNotification(data: any) {
    return this.request('post', '/notifications/schedule', data);
  }

  async getUpcomingNotifications() {
    return this.request('get', '/notifications/upcoming');
  }

  async updateNotificationPreferences(preferences: any) {
    return this.request('put', '/notifications/preferences', preferences);
  }

  async deleteNotification(notificationId: string) {
    return this.request('delete', `/notifications/${notificationId}`);
  }

  // Admin endpoints
  async createTrainer(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    specialization: string;
  }) {
    return this.request('post', '/admin/trainers', data);
  }

  async listUsers(role?: string, search?: string, page?: number, per_page?: number) {
    const params: any = {};
    if (role) params.role = role;
    if (search) params.search = search;
    if (page) params.page = page;
    if (per_page) params.per_page = per_page;

    return this.request('get', '/admin/users', undefined, { params });
  }

  async getUserDetails(userId: string) {
    return this.request('get', `/admin/users/${userId}`);
  }

  async updateUser(userId: string, data: any) {
    return this.request('put', `/admin/users/${userId}`, data);
  }

  async deleteUser(userId: string) {
    return this.request('delete', `/admin/users/${userId}`);
  }

  async getSystemStats() {
    return this.request('get', '/admin/stats');
  }

  async assignClientsToTrainer(trainerId: string, userIds: string[]) {
    return this.request('post', `/admin/trainers/${trainerId}/assign`, { user_ids: userIds });
  }

  // Trainer endpoints
  async getTrainerDashboardStats() {
    return this.request('get', '/trainer/dashboard/stats');
  }

  async getTrainerClients() {
    return this.request('get', '/trainer/clients');
  }

  async getClientPerformance(clientId: string, days?: number) {
    const params = days ? { days } : {};
    return this.request('get', `/trainer/clients/${clientId}/performance`, undefined, { params });
  }

  async addClientFeedback(clientId: string, sessionId: string, feedback: string) {
    return this.request('post', `/trainer/clients/${clientId}/feedback`, {
      session_id: sessionId,
      feedback,
    });
  }

  async getClientWorkoutPlan(clientId: string) {
    return this.request('get', `/trainer/clients/${clientId}/workout-plan`);
  }

  async adjustClientWorkoutPlan(clientId: string, adjustments: any) {
    return this.request('put', `/trainer/clients/${clientId}/workout-plan`, adjustments);
  }

  async getClientMealPlan(clientId: string) {
    return this.request('get', `/trainer/clients/${clientId}/meal-plan`);
  }

  async getClientWorkoutSession(clientId: string, sessionId: string) {
    return this.request('get', `/trainer/clients/${clientId}/sessions/${sessionId}`);
  }
}

export default new ApiService();
