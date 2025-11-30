import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button, Input } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import apiService from '../../services/api';

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    const result = await apiService.forgotPassword(email);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Password reset instructions sent to your email', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to send reset email');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>
      
      <Input
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        icon="email"
      />

      <Button title="Send Reset Link" onPress={handleResetPassword} loading={loading} fullWidth />
      <Button
        title="Back to Login"
        onPress={() => navigation.goBack()}
        variant="text"
        fullWidth
        style={styles.backButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.xl, backgroundColor: COLORS.background },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.sm },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  backButton: { marginTop: SPACING.md },
});
