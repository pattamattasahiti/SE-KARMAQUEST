import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

export const WelcomeScreen = ({ navigation }: any) => {
  return (
    <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>💪</Text>
        <Text style={styles.title}>KarmaQuest</Text>
        <Text style={styles.subtitle}>Your AI-Powered Fitness Companion</Text>
        
        <View style={styles.buttonContainer}>
          <Button title="Get Started" onPress={() => navigation.navigate('Signup')} fullWidth />
          <Button
            title="Sign In"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            fullWidth
            style={styles.signInButton}
          />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  logo: { fontSize: 80, marginBottom: SPACING.md },
  title: { fontSize: FONT_SIZES.xxxl, fontWeight: 'bold', color: COLORS.surface, marginBottom: SPACING.sm },
  subtitle: { fontSize: FONT_SIZES.lg, color: COLORS.surface, opacity: 0.9, textAlign: 'center', marginBottom: SPACING.xxl },
  buttonContainer: { width: '100%', marginTop: SPACING.xl },
  signInButton: { marginTop: SPACING.md },
});
