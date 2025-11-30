import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';
import { COLORS, LAYOUT } from '../constants';

// Auth Screens
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

// Admin Navigator
import { AdminNavigator } from './AdminNavigator';

// Trainer Navigator
import { TrainerNavigator } from './TrainerNavigator';

// Main Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import WorkoutScreen from '../screens/workout/WorkoutScreen';
import ExerciseSelectionScreen from '../screens/workout/ExerciseSelectionScreen';
import LiveWorkoutScreen from '../screens/workout/LiveWorkoutScreen';
import LiveCameraWorkoutScreen from '../screens/workout/LiveCameraWorkoutScreen';
import AIVideoWorkoutScreen from '../screens/workout/AIVideoWorkoutScreen';
import WorkoutSummaryScreen from '../screens/workout/WorkoutSummaryScreen';
import WorkoutPlanScreen from '../screens/workout/WorkoutPlanScreen';
import MealPlanScreen from '../screens/workout/MealPlanScreen';
import ExerciseLibraryScreen from '../screens/workout/ExerciseLibraryScreen';
import PlansScreen from '../screens/plans/PlansScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import FitnessGoalsScreen from '../screens/profile/FitnessGoalsScreen';
import BodyMeasurementsScreen from '../screens/profile/BodyMeasurementsScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import PrivacySecurityScreen from '../screens/profile/PrivacySecurityScreen';
import HelpSupportScreen from '../screens/profile/HelpSupportScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const WorkoutStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

const WorkoutNavigator = () => (
  <WorkoutStack.Navigator>
    <WorkoutStack.Screen 
      name="WorkoutHome" 
      component={WorkoutScreen}
      options={{ headerShown: false }}
    />
    <WorkoutStack.Screen 
      name="ExerciseSelection" 
      component={ExerciseSelectionScreen}
      options={{ 
        title: 'Select Exercises',
        headerBackTitle: 'Back'
      }}
    />
    <WorkoutStack.Screen 
      name="LiveWorkout" 
      component={LiveWorkoutScreen}
      options={{ 
        headerShown: false,
        gestureEnabled: false // Prevent back swipe during workout
      }}
    />
    <WorkoutStack.Screen 
      name="LiveCameraWorkout" 
      component={LiveCameraWorkoutScreen}
      options={{ 
        headerShown: false,
        gestureEnabled: false // Prevent back swipe during workout
      }}
    />
    <WorkoutStack.Screen 
      name="AIVideoWorkout" 
      component={AIVideoWorkoutScreen}
      options={{ 
        headerShown: false,
        gestureEnabled: false // Prevent back swipe during workout
      }}
    />
    <WorkoutStack.Screen 
      name="WorkoutSummary" 
      component={WorkoutSummaryScreen}
      options={{ 
        title: 'Workout Summary',
        headerLeft: () => null, // Remove back button
        gestureEnabled: false
      }}
    />
    <WorkoutStack.Screen 
      name="WorkoutPlan" 
      component={WorkoutPlanScreen}
      options={{ headerShown: false }}
    />
    <WorkoutStack.Screen 
      name="MealPlan" 
      component={MealPlanScreen}
      options={{ headerShown: false }}
    />
    <WorkoutStack.Screen 
      name="Plans" 
      component={PlansScreen}
      options={{ headerShown: false }}
    />
    <WorkoutStack.Screen 
      name="ExerciseLibrary" 
      component={ExerciseLibraryScreen}
      options={{ headerShown: false }}
    />
  </WorkoutStack.Navigator>
);

const ProfileNavigator = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen 
      name="ProfileHome" 
      component={ProfileScreen}
      options={{ headerShown: false }}
    />
    <ProfileStack.Screen 
      name="EditProfile" 
      component={EditProfileScreen}
      options={{ headerShown: false }}
    />
    <ProfileStack.Screen 
      name="FitnessGoals" 
      component={FitnessGoalsScreen}
      options={{ headerShown: false }}
    />
    <ProfileStack.Screen 
      name="BodyMeasurements" 
      component={BodyMeasurementsScreen}
      options={{ headerShown: false }}
    />
    <ProfileStack.Screen 
      name="Notifications" 
      component={NotificationsScreen}
      options={{ headerShown: false }}
    />
    <ProfileStack.Screen 
      name="PrivacySecurity" 
      component={PrivacySecurityScreen}
      options={{ headerShown: false }}
    />
    <ProfileStack.Screen 
      name="HelpSupport" 
      component={HelpSupportScreen}
      options={{ headerShown: false }}
    />
  </ProfileStack.Navigator>
);

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textSecondary,
      headerShown: false,
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Workout"
      component={WorkoutNavigator}
      options={{
        tabBarIcon: ({ color, size }) => <MaterialIcons name="fitness-center" size={size} color={color} />,
      }}
      listeners={({ navigation }) => ({
        tabPress: (e) => {
          // Reset to WorkoutHome when tab is pressed
          navigation.navigate('Workout', { screen: 'WorkoutHome' });
        },
      })}
    />
    <Tab.Screen
      name="Progress"
      component={ProgressScreen}
      options={{
        tabBarIcon: ({ color, size }) => <MaterialIcons name="trending-up" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileNavigator}
      options={{
        tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return null; // Or a loading screen
  }

  // Determine which navigator to show based on role
  const getNavigator = () => {
    if (!isAuthenticated) {
      return <AuthNavigator />;
    }

    // Role-based navigation
    if (role === 'admin') {
      return <AdminNavigator />;
    } else if (role === 'trainer') {
      return <TrainerNavigator />;
    } else {
      // Regular user
      return <MainTabNavigator />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <NavigationContainer>
        {getNavigator()}
      </NavigationContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    // Adjust LAYOUT.TOP_SAFE_PADDING in constants/index.ts to control top spacing
    // 0 = content starts right below status bar
    // Increase by 5, 10, 15, etc. if you need more space
    paddingTop: LAYOUT.TOP_SAFE_PADDING,
  },
});
