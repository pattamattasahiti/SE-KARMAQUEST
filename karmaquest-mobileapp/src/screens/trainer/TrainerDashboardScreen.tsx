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

interface DashboardStats {
  total_clients: number;
  active_clients: number;
  total_workouts_this_week: number;
  avg_performance_score: number;
}

export const TrainerDashboardScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    total_clients: 0,
    active_clients: 0,
    total_workouts_this_week: 0,
    avg_performance_score: 0,
  });
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load assigned clients
      const response = await apiService.getTrainerClients();
      
      if (response.success && response.data) {
        const clientsData = (response.data as any).clients || [];
        setClients(clientsData);
        
        // Calculate stats from clients data
        const totalClients = clientsData.length;
        const activeClients = clientsData.filter((c: any) => c.last_workout_date).length;
        
        setStats({
          total_clients: totalClients,
          active_clients: activeClients,
          total_workouts_this_week: 0, // Can be calculated if we have workout data
          avg_performance_score: 0, // Can be calculated from performance data
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
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
          <Text style={styles.welcomeText}>Welcome, Coach</Text>
          <Text style={styles.emailText}>{user?.first_name} {user?.last_name}</Text>
          {user?.trainer_specialization && (
            <Text style={styles.specializationText}>
              <MaterialIcons name="star" size={14} color={COLORS.secondary} />{' '}
              {user.trainer_specialization}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <MaterialIcons name="logout" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="people" size={32} color={COLORS.primary} />
          <Text style={styles.statValue}>{stats.total_clients}</Text>
          <Text style={styles.statLabel}>Total Clients</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialIcons name="check-circle" size={32} color={COLORS.success} />
          <Text style={styles.statValue}>{stats.active_clients}</Text>
          <Text style={styles.statLabel}>Active Clients</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialIcons name="fitness-center" size={32} color={COLORS.secondary} />
          <Text style={styles.statValue}>{stats.total_workouts_this_week}</Text>
          <Text style={styles.statLabel}>Workouts This Week</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialIcons name="trending-up" size={32} color={COLORS.info} />
          <Text style={styles.statValue}>
            {stats.avg_performance_score ? stats.avg_performance_score.toFixed(1) : '0.0'}
          </Text>
          <Text style={styles.statLabel}>Avg Performance</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => {
            // Navigate to Clients tab and reset to ClientList screen
            (navigation as any).navigate('Clients', {
              screen: 'ClientList',
            });
          }}
        >
          <View style={styles.actionIconContainer}>
            <MaterialIcons name="people" size={28} color={COLORS.primary} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>View All Clients</Text>
            <Text style={styles.actionDescription}>
              See performance summaries and progress data
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => {
            // Navigate to Clients tab and reset to ClientList screen
            (navigation as any).navigate('Clients', {
              screen: 'ClientList',
            });
          }}
        >
          <View style={styles.actionIconContainer}>
            <MaterialIcons name="bar-chart" size={28} color={COLORS.secondary} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Performance Trends</Text>
            <Text style={styles.actionDescription}>
              Monitor multiple users' performance trends
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => {
            // Navigate to Clients tab and reset to ClientList screen
            (navigation as any).navigate('Clients', {
              screen: 'ClientList',
            });
          }}
        >
          <View style={styles.actionIconContainer}>
            <MaterialIcons name="assignment" size={28} color={COLORS.success} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Review Plans</Text>
            <Text style={styles.actionDescription}>
              Approve or adjust workout and meal plans
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Recent Clients */}
      {clients.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Clients</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Clients')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {clients.slice(0, 3).map((client: any) => (
            <TouchableOpacity
              key={client.user_id}
              style={styles.clientCard}
              onPress={() => {
                // Navigate to Clients tab first, then to ClientDetail
                (navigation as any).navigate('Clients', {
                  screen: 'ClientDetail',
                  params: { clientId: client.user_id }
                });
              }}
            >
              <View style={styles.clientAvatar}>
                <MaterialIcons name="person" size={24} color={COLORS.white} />
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>
                  {client.first_name} {client.last_name}
                </Text>
                <Text style={styles.clientEmail}>{client.email}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty State */}
      {clients.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialIcons name="people-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyStateText}>No Clients Assigned</Text>
          <Text style={styles.emptyStateSubtext}>
            Contact your admin to get clients assigned to you
          </Text>
        </View>
      )}
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
  specializationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.secondary,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
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
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  clientEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
