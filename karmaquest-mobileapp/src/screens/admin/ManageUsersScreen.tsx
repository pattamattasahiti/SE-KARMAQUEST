import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { User } from '../../types';
import apiService from '../../services/api';

type RoleTab = 'all' | 'user' | 'trainer' | 'admin';

export const ManageUsersScreen = () => {
  const navigation = useNavigation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, [selectedRole]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  const loadUsers = async () => {
    try {
      const role = selectedRole === 'all' ? undefined : selectedRole;
      const response = await apiService.listUsers(role);
      
      if (response.success && response.data) {
        const data = response.data as any;
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.email?.toLowerCase().includes(query) ||
        user.first_name?.toLowerCase().includes(query) ||
        user.last_name?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.first_name} ${user.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.deleteUser(user.user_id);
              if (response.success) {
                Alert.alert('Success', 'User deleted successfully');
                loadUsers();
              } else {
                Alert.alert('Error', response.error || 'Failed to delete user');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return COLORS.error;
      case 'trainer':
        return COLORS.secondary;
      case 'user':
      default:
        return COLORS.primary;
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>
            {item.first_name} {item.last_name}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) }]}>
            <Text style={styles.roleBadgeText}>{item.role?.toUpperCase() || 'USER'}</Text>
          </View>
        </View>
        <Text style={styles.userEmail}>{item.email}</Text>
        {item.trainer_specialization && (
          <Text style={styles.specialization}>
            <MaterialIcons name="star" size={14} color={COLORS.secondary} />{' '}
            {item.trainer_specialization}
          </Text>
        )}
        {item.assigned_users && item.assigned_users.length > 0 && (
          <Text style={styles.assignedUsers}>
            <MaterialIcons name="group" size={14} color={COLORS.primary} /> {item.assigned_users.length} clients
          </Text>
        )}
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            // Navigate to appropriate edit screen based on role
            if (item.role === 'trainer') {
              (navigation as any).navigate('EditTrainer', { trainerId: item.user_id });
            } else {
              (navigation as any).navigate('EditUser', { userId: item.user_id });
            }
          }}
        >
          <MaterialIcons name="edit" size={20} color={COLORS.info} />
        </TouchableOpacity>
        {item.role !== 'admin' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteUser(item)}
          >
            <MaterialIcons name="delete" size={20} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="people-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyStateText}>No users found</Text>
      <Text style={styles.emptyStateSubtext}>
        {searchQuery ? 'Try a different search query' : 'Users will appear here'}
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
        <Text style={styles.headerTitle}>Manage Users</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
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

      {/* Role Tabs */}
      <View style={styles.tabsContainer}>
        {(['all', 'user', 'trainer', 'admin'] as RoleTab[]).map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.tab, selectedRole === role && styles.tabActive]}
            onPress={() => {
              setSelectedRole(role);
              setLoading(true);
            }}
          >
            <Text style={[styles.tabText, selectedRole === role && styles.tabTextActive]}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING.lg,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  userName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  roleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  userEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  specialization: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.secondary,
    marginTop: SPACING.xs,
  },
  assignedUsers: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  userActions: {
    flexDirection: 'column',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.background,
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
  },
});
