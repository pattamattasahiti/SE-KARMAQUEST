import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import apiService from '../../services/api';

interface Client {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  last_workout_date?: string;
  total_workouts?: number;
  avg_performance?: number;
}

export const ClientListScreen = () => {
  const navigation = useNavigation();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchQuery]);

  const loadClients = async () => {
    try {
      const response = await apiService.getTrainerClients();
      
      if (response.success && response.data) {
        const clientsData = (response.data as any).clients || [];
        setClients(clientsData);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterClients = () => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.email?.toLowerCase().includes(query) ||
        client.first_name?.toLowerCase().includes(query) ||
        client.last_name?.toLowerCase().includes(query)
    );
    setFilteredClients(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No activity';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getPerformanceColor = (score?: number) => {
    if (!score) return COLORS.textSecondary;
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  };

  const renderClientItem = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => (navigation as any).navigate('ClientDetail', { clientId: item.user_id })}
    >
      <View style={styles.clientAvatar}>
        <MaterialIcons name="person" size={28} color={COLORS.white} />
      </View>
      
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={styles.clientEmail}>{item.email}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialIcons name="fitness-center" size={14} color={COLORS.textSecondary} />
            <Text style={styles.statText}>{item.total_workouts || 0} workouts</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="access-time" size={14} color={COLORS.textSecondary} />
            <Text style={styles.statText}>{formatDate(item.last_workout_date)}</Text>
          </View>
        </View>
        
        {item.avg_performance !== undefined && (
          <View style={styles.performanceBadge}>
            <Text style={[styles.performanceText, { color: getPerformanceColor(item.avg_performance) }]}>
              Performance: {item.avg_performance.toFixed(0)}%
            </Text>
          </View>
        )}
      </View>
      
      <MaterialIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="people-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyStateText}>No Clients Found</Text>
      <Text style={styles.emptyStateSubtext}>
        {searchQuery ? 'Try a different search query' : 'No clients assigned yet'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Clients</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Client Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredClients.length} {filteredClients.length === 1 ? 'Client' : 'Clients'}
        </Text>
      </View>

      {/* Client List */}
      <FlatList
        data={filteredClients}
        renderItem={renderClientItem}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
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
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  countContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  countText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.lg,
  },
  clientCard: {
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
  clientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    fontWeight: 'bold',
    color: COLORS.text,
  },
  clientEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  performanceBadge: {
    marginTop: SPACING.sm,
  },
  performanceText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
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
  },
});
