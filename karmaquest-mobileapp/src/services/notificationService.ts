/**
 * Notification Service
 * 
 * Handles push notifications for workout reminders, achievement alerts,
 * and other app notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPermissions {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain: boolean;
}

export interface WorkoutReminder {
  id: string;
  title: string;
  body: string;
  trigger: Notifications.NotificationTriggerInput;
}

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<NotificationPermissions> => {
  const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
  
  return {
    status: status as 'granted' | 'denied' | 'undetermined',
    canAskAgain,
  };
};

/**
 * Check notification permissions
 */
export const checkNotificationPermissions = async (): Promise<NotificationPermissions> => {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  
  return {
    status: status as 'granted' | 'denied' | 'undetermined',
    canAskAgain,
  };
};

/**
 * Get push notification token (for backend registration)
 */
export const getPushToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C63FF',
      });
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    console.error('[Notifications] Failed to get push token:', error);
    return null;
  }
};

/**
 * Schedule a workout reminder
 * 
 * @param time - Time in format "HH:mm" (e.g., "09:00")
 * @param daysOfWeek - Array of day indices (0=Sunday, 1=Monday, etc.)
 * @param title - Notification title
 * @param body - Notification body
 */
export const scheduleWorkoutReminder = async (
  time: string,
  daysOfWeek: number[],
  title: string = 'Time to Workout!',
  body: string = "Don't skip your workout today. Your future self will thank you! 💪"
): Promise<string[]> => {
  const [hours, minutes] = time.split(':').map(Number);
  const notificationIds: string[] = [];

  for (const day of daysOfWeek) {
    const trigger: any = {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: day,
      hour: hours,
      minute: minutes,
      repeats: true,
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'workout_reminder' },
      },
      trigger,
    });

    notificationIds.push(id);
  }

  console.log(`[Notifications] Scheduled ${notificationIds.length} workout reminders`);
  return notificationIds;
};

/**
 * Schedule a one-time notification
 */
export const scheduleNotification = async (
  title: string,
  body: string,
  seconds: number
): Promise<string> => {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });

  console.log(`[Notifications] Scheduled notification: ${id}`);
  return id;
};

/**
 * Cancel a specific notification
 */
export const cancelNotification = async (notificationId: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
  console.log(`[Notifications] Cancelled notification: ${notificationId}`);
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] Cancelled all notifications');
};

/**
 * Get all scheduled notifications
 */
export const getAllScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  return await Notifications.getAllScheduledNotificationsAsync();
};

/**
 * Send an immediate local notification
 */
export const sendImmediateNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string> => {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: data || {},
    },
    trigger: null, // null means immediate
  });

  return id;
};

/**
 * Achievement notification
 */
export const sendAchievementNotification = async (
  achievementName: string,
  description: string
): Promise<string> => {
  return sendImmediateNotification(
    `🏆 Achievement Unlocked!`,
    `${achievementName}: ${description}`,
    { type: 'achievement', name: achievementName }
  );
};

/**
 * Workout completion notification
 */
export const sendWorkoutCompletionNotification = async (
  duration: number,
  calories: number
): Promise<string> => {
  const durationMin = Math.floor(duration / 60);
  return sendImmediateNotification(
    '✅ Workout Complete!',
    `Great job! ${durationMin} min workout, ${calories} cal burned 🔥`,
    { type: 'workout_complete', duration, calories }
  );
};

/**
 * Streak notification
 */
export const sendStreakNotification = async (days: number): Promise<string> => {
  return sendImmediateNotification(
    `🔥 ${days} Day Streak!`,
    `You're on fire! Keep up the amazing work!`,
    { type: 'streak', days }
  );
};

/**
 * Weekly goal reminder
 */
export const sendWeeklyGoalReminder = async (
  workoutsDone: number,
  workoutsTarget: number
): Promise<string> => {
  const remaining = workoutsTarget - workoutsDone;
  if (remaining > 0) {
    return sendImmediateNotification(
      '📊 Weekly Goal Update',
      `${remaining} more workout${remaining === 1 ? '' : 's'} to reach your weekly goal!`,
      { type: 'weekly_goal', done: workoutsDone, target: workoutsTarget }
    );
  } else {
    return sendImmediateNotification(
      '🎉 Weekly Goal Achieved!',
      `Amazing! You've completed all ${workoutsTarget} workouts this week!`,
      { type: 'weekly_goal_complete', total: workoutsTarget }
    );
  }
};

/**
 * Add notification response listener
 * 
 * This allows handling notification taps
 */
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Add notification received listener
 * 
 * This triggers when a notification is received while app is in foreground
 */
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Preset notification schedules
 */
export const presetSchedules = {
  earlyBird: { time: '06:00', days: [1, 3, 5] }, // Mon, Wed, Fri at 6 AM
  morningRoutine: { time: '08:00', days: [1, 2, 3, 4, 5] }, // Weekdays at 8 AM
  lunchBreak: { time: '12:30', days: [1, 2, 3, 4, 5] }, // Weekdays at 12:30 PM
  afterWork: { time: '18:00', days: [1, 2, 3, 4, 5] }, // Weekdays at 6 PM
  weekendWarrior: { time: '09:00', days: [0, 6] }, // Sat, Sun at 9 AM
};

/**
 * Initialize notification service
 * 
 * Call this once when the app starts
 */
export const initializeNotifications = async (): Promise<void> => {
  console.log('[Notifications] Initializing notification service...');
  
  // Request permissions
  const permissions = await requestNotificationPermissions();
  
  if (permissions.status === 'granted') {
    console.log('[Notifications] Permissions granted');
    
    // Get push token for backend
    const token = await getPushToken();
    if (token) {
      console.log('[Notifications] Push token obtained:', token.substring(0, 20) + '...');
      // TODO: Send token to backend for push notifications
      // apiService.registerPushToken(token);
    }
  } else {
    console.log('[Notifications] Permissions not granted:', permissions.status);
  }
};

export default {
  requestNotificationPermissions,
  checkNotificationPermissions,
  getPushToken,
  scheduleWorkoutReminder,
  scheduleNotification,
  cancelNotification,
  cancelAllNotifications,
  getAllScheduledNotifications,
  sendImmediateNotification,
  sendAchievementNotification,
  sendWorkoutCompletionNotification,
  sendStreakNotification,
  sendWeeklyGoalReminder,
  addNotificationResponseListener,
  addNotificationReceivedListener,
  presetSchedules,
  initializeNotifications,
};
