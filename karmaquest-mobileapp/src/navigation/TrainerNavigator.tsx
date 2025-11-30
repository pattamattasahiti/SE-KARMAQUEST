import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';

// Trainer Screens
import {
  TrainerDashboardScreen,
  ClientListScreen,
  ClientDetailScreen,
  WorkoutDetailScreen,
} from '../screens/trainer';

// Profile Screen (shared with user)
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Dashboard Stack
const DashboardStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="TrainerDashboard" component={TrainerDashboardScreen} />
  </Stack.Navigator>
);

// Clients Stack
const ClientsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
    initialRouteName="ClientList"
  >
    <Stack.Screen name="ClientList" component={ClientListScreen} />
    <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
    <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
  </Stack.Navigator>
);

// Main Trainer Tab Navigator
export const TrainerNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardStack}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="dashboard" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Clients"
      component={ClientsStack}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="people" size={size} color={color} />
        ),
      }}
      listeners={({ navigation }) => ({
        tabPress: (e) => {
          // Get the state to check if we're on a nested screen
          const state = navigation.getState();
          const clientsRoute = state.routes.find((r: any) => r.name === 'Clients');
          
          if (clientsRoute && clientsRoute.state) {
            // If there's a state, it means we have nested screens
            // Pop to top to go back to ClientList
            e.preventDefault();
            navigation.navigate('Clients', { screen: 'ClientList' });
          }
        },
      })}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileStack}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="person" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);
