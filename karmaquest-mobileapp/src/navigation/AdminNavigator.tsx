import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  AdminDashboardScreen,
  CreateTrainerScreen,
  ManageUsersScreen,
  EditUserScreen,
  EditTrainerScreen,
} from '../screens/admin';

export type AdminStackParamList = {
  AdminDashboard: undefined;
  CreateTrainer: undefined;
  ManageUsers: undefined;
  EditUser: { userId: string };
  EditTrainer: { trainerId: string };
};

const Stack = createStackNavigator<AdminStackParamList>();

export const AdminNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="CreateTrainer" component={CreateTrainerScreen} />
      <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
      <Stack.Screen name="EditUser" component={EditUserScreen} />
      <Stack.Screen name="EditTrainer" component={EditTrainerScreen} />
    </Stack.Navigator>
  );
};
