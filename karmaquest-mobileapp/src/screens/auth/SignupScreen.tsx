import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../store/AuthContext';
import { Button, Input } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { validation } from '../../utils';

interface SignupScreenProps {
  navigation: any;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validation.isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validation.isValidPassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const result = await register({
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      password: formData.password,
    });

    setLoading(false);

    if (!result.success) {
      Alert.alert('Registration Failed', result.error || 'An error occurred');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your fitness journey today</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="First Name"
              placeholder="Enter your first name"
              value={formData.first_name}
              onChangeText={(text) => setFormData({ ...formData, first_name: text })}
              icon="person"
              error={errors.first_name}
            />

            <Input
              label="Last Name"
              placeholder="Enter your last name"
              value={formData.last_name}
              onChangeText={(text) => setFormData({ ...formData, last_name: text })}
              icon="person"
              error={errors.last_name}
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="email"
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="Create a password"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
              icon="lock"
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              secureTextEntry
              icon="lock"
              error={errors.confirmPassword}
            />

            <Button
              title="Sign Up"
              onPress={handleSignup}
              loading={loading}
              fullWidth
              style={styles.signupButton}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  title: { fontSize: FONT_SIZES.xxxl, fontWeight: 'bold', color: COLORS.surface, marginBottom: SPACING.sm },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.surface, opacity: 0.9, textAlign: 'center' },
  form: { backgroundColor: COLORS.surface, borderRadius: 24, padding: SPACING.xl },
  signupButton: { marginTop: SPACING.md },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg },
  loginText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
  loginLink: { color: COLORS.primary, fontSize: FONT_SIZES.md, fontWeight: '600' },
});
