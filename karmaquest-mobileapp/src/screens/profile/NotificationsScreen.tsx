import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { Card } from '../../components/common/Card';

interface Props {
  navigation: any;
}

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export default function NotificationsScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  
  // Notification categories
  const [workoutNotifications, setWorkoutNotifications] = useState<NotificationSetting[]>([
    {
      id: 'workout_reminders',
      title: 'Workout Reminders',
      description: 'Get reminders for scheduled workouts',
      icon: 'alarm',
      enabled: true,
    },
    {
      id: 'rest_day_reminders',
      title: 'Rest Day Alerts',
      description: 'Reminders to take rest days',
      icon: 'bed',
      enabled: true,
    },
    {
      id: 'workout_completed',
      title: 'Workout Completion',
      description: 'Celebrate when you complete a workout',
      icon: 'checkmark-circle',
      enabled: true,
    },
  ]);

  const [progressNotifications, setProgressNotifications] = useState<NotificationSetting[]>([
    {
      id: 'weekly_summary',
      title: 'Weekly Summary',
      description: 'Receive your weekly progress report',
      icon: 'stats-chart',
      enabled: true,
    },
    {
      id: 'milestone_achieved',
      title: 'Milestone Achievements',
      description: 'Notifications when you hit milestones',
      icon: 'trophy',
      enabled: true,
    },
    {
      id: 'weight_updates',
      title: 'Weight Progress',
      description: 'Updates on your weight journey',
      icon: 'trending-down',
      enabled: false,
    },
  ]);

  const [socialNotifications, setSocialNotifications] = useState<NotificationSetting[]>([
    {
      id: 'community_updates',
      title: 'Community Updates',
      description: 'News from the KarmaQuest community',
      icon: 'people',
      enabled: false,
    },
    {
      id: 'tips_motivation',
      title: 'Tips & Motivation',
      description: 'Daily fitness tips and motivation',
      icon: 'bulb',
      enabled: true,
    },
  ]);

  const [generalSettings, setGeneralSettings] = useState({
    pushEnabled: true,
    emailEnabled: false,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const toggleWorkoutNotification = (id: string) => {
    setWorkoutNotifications(prev =>
      prev.map(item =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const toggleProgressNotification = (id: string) => {
    setProgressNotifications(prev =>
      prev.map(item =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const toggleSocialNotification = (id: string) => {
    setSocialNotifications(prev =>
      prev.map(item =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const handleSave = async () => {
    setLoading(true);
    
    // Simulate API call to save notification preferences
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Notification preferences saved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }, 1000);
  };

  const enableAll = () => {
    setWorkoutNotifications(prev => prev.map(item => ({ ...item, enabled: true })));
    setProgressNotifications(prev => prev.map(item => ({ ...item, enabled: true })));
    setSocialNotifications(prev => prev.map(item => ({ ...item, enabled: true })));
    setGeneralSettings({
      pushEnabled: true,
      emailEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
    });
  };

  const disableAll = () => {
    setWorkoutNotifications(prev => prev.map(item => ({ ...item, enabled: false })));
    setProgressNotifications(prev => prev.map(item => ({ ...item, enabled: false })));
    setSocialNotifications(prev => prev.map(item => ({ ...item, enabled: false })));
    setGeneralSettings({
      pushEnabled: false,
      emailEnabled: false,
      soundEnabled: false,
      vibrationEnabled: false,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.saveButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={enableAll}>
            <Ionicons name="checkmark-done" size={20} color={COLORS.success} />
            <Text style={styles.quickActionText}>Enable All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={disableAll}>
            <Ionicons name="close-circle" size={20} color={COLORS.error} />
            <Text style={styles.quickActionText}>Disable All</Text>
          </TouchableOpacity>
        </View>

        {/* General Settings */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>General Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color={COLORS.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Receive push notifications on your device</Text>
              </View>
            </View>
            <Switch
              value={generalSettings.pushEnabled}
              onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, pushEnabled: value }))}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={generalSettings.pushEnabled ? COLORS.primary : COLORS.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="mail" size={24} color={COLORS.info} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Email Notifications</Text>
                <Text style={styles.settingDescription}>Receive notifications via email</Text>
              </View>
            </View>
            <Switch
              value={generalSettings.emailEnabled}
              onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, emailEnabled: value }))}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={generalSettings.emailEnabled ? COLORS.primary : COLORS.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="volume-high" size={24} color={COLORS.warning} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Sound</Text>
                <Text style={styles.settingDescription}>Play sound with notifications</Text>
              </View>
            </View>
            <Switch
              value={generalSettings.soundEnabled}
              onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, soundEnabled: value }))}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={generalSettings.soundEnabled ? COLORS.primary : COLORS.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="phone-portrait" size={24} color={COLORS.secondary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Vibration</Text>
                <Text style={styles.settingDescription}>Vibrate for notifications</Text>
              </View>
            </View>
            <Switch
              value={generalSettings.vibrationEnabled}
              onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, vibrationEnabled: value }))}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={generalSettings.vibrationEnabled ? COLORS.primary : COLORS.textSecondary}
            />
          </View>
        </Card>

        {/* Workout Notifications */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Notifications</Text>
          {workoutNotifications.map((item) => (
            <View key={item.id} style={styles.notificationItem}>
              <View style={styles.notificationLeft}>
                <View style={[styles.notificationIcon, { backgroundColor: COLORS.primary + '20' }]}>
                  <Ionicons name={item.icon as any} size={20} color={COLORS.primary} />
                </View>
                <View style={styles.notificationTextContainer}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationDescription}>{item.description}</Text>
                </View>
              </View>
              <Switch
                value={item.enabled}
                onValueChange={() => toggleWorkoutNotification(item.id)}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
                thumbColor={item.enabled ? COLORS.primary : COLORS.textSecondary}
              />
            </View>
          ))}
        </Card>

        {/* Progress Notifications */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Progress Notifications</Text>
          {progressNotifications.map((item) => (
            <View key={item.id} style={styles.notificationItem}>
              <View style={styles.notificationLeft}>
                <View style={[styles.notificationIcon, { backgroundColor: COLORS.success + '20' }]}>
                  <Ionicons name={item.icon as any} size={20} color={COLORS.success} />
                </View>
                <View style={styles.notificationTextContainer}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationDescription}>{item.description}</Text>
                </View>
              </View>
              <Switch
                value={item.enabled}
                onValueChange={() => toggleProgressNotification(item.id)}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
                thumbColor={item.enabled ? COLORS.primary : COLORS.textSecondary}
              />
            </View>
          ))}
        </Card>

        {/* Social Notifications */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Social & Updates</Text>
          {socialNotifications.map((item) => (
            <View key={item.id} style={styles.notificationItem}>
              <View style={styles.notificationLeft}>
                <View style={[styles.notificationIcon, { backgroundColor: COLORS.info + '20' }]}>
                  <Ionicons name={item.icon as any} size={20} color={COLORS.info} />
                </View>
                <View style={styles.notificationTextContainer}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationDescription}>{item.description}</Text>
                </View>
              </View>
              <Switch
                value={item.enabled}
                onValueChange={() => toggleSocialNotification(item.id)}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
                thumbColor={item.enabled ? COLORS.primary : COLORS.textSecondary}
              />
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: SPACING.xs,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  notificationDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
