import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { useAuth } from '../../store/AuthContext';
import apiService from '../../services/api';

interface SystemStats {
  total_users: number;
  total_trainers: number;
  total_workouts: number;
  active_users: number;
  new_users_this_week: number;
}

export const AdminDashboardScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiService.getSystemStats();
      if (response.success && response.data) {
        setStats(response.data as SystemStats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome, Admin</Text>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <MaterialIcons name="logout" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="people" size={32} color={COLORS.primary} />
          <Text style={styles.statValue}>{stats?.total_users || 0}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialIcons name="fitness-center" size={32} color={COLORS.secondary} />
          <Text style={styles.statValue}>{stats?.total_trainers || 0}</Text>
          <Text style={styles.statLabel}>Trainers</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialIcons name="trending-up" size={32} color={COLORS.success} />
          <Text style={styles.statValue}>{stats?.total_workouts || 0}</Text>
          <Text style={styles.statLabel}>Total Workouts</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialIcons name="check-circle" size={32} color={COLORS.info} />
          <Text style={styles.statValue}>{stats?.active_users || 0}</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => (navigation as any).navigate('CreateTrainer')}
        >
          <View style={styles.actionIconContainer}>
            <MaterialIcons name="person-add" size={28} color={COLORS.primary} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Create Trainer Account</Text>
            <Text style={styles.actionDescription}>Add a new trainer to the system</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => (navigation as any).navigate('ManageUsers')}
        >
          <View style={styles.actionIconContainer}>
            <MaterialIcons name="people" size={28} color={COLORS.secondary} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Manage Users & Trainers</Text>
            <Text style={styles.actionDescription}>View, edit, delete, or assign clients</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* System Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>New Users This Week:</Text>
            <Text style={styles.infoValue}>{stats?.new_users_this_week || 0}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>System Status:</Text>
            <Text style={[styles.infoValue, { color: COLORS.success }]}>Operational</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  welcomeText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  logoutButton: {
    padding: SPACING.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  actionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
});
