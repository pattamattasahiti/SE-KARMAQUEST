import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { Card } from '../../components/common/Card';

interface Props {
  navigation: any;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function HelpSupportScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const faqs: FAQItem[] = [
    {
      id: '1',
      category: 'Getting Started',
      question: 'How do I create my first workout?',
      answer: 'Navigate to the Workout tab, tap on "Start Workout", select your exercises, and begin your training session. The app will guide you through each exercise with AI-powered form feedback.',
    },
    {
      id: '2',
      category: 'Getting Started',
      question: 'How does the AI camera feature work?',
      answer: 'The AI camera uses your device camera to analyze your form in real-time during exercises. It provides immediate feedback on your posture, depth, and technique to help you perform exercises safely and effectively.',
    },
    {
      id: '3',
      category: 'Workouts',
      question: 'Can I customize my workout plan?',
      answer: 'Yes! You can create custom workout plans by selecting specific exercises, setting target reps and sets, and scheduling workouts for specific days. Go to the Workout tab to get started.',
    },
    {
      id: '4',
      category: 'Workouts',
      question: 'How do I track my progress?',
      answer: 'Your progress is automatically tracked with each completed workout. Visit the Progress tab to see detailed statistics, charts, and your workout history.',
    },
    {
      id: '5',
      category: 'Account',
      question: 'How do I update my fitness goals?',
      answer: 'Go to Profile > Fitness Goals to update your primary goal, weekly workout target, and target weight. The app will adjust your recommendations accordingly.',
    },
    {
      id: '6',
      category: 'Account',
      question: 'Can I export my workout data?',
      answer: 'Yes! Go to Profile > Privacy & Security > Export My Data. We will send a download link to your registered email within 24 hours.',
    },
    {
      id: '7',
      category: 'Technical',
      question: 'The app is not tracking my exercises correctly',
      answer: 'Make sure you have granted camera permissions and your device has good lighting. Position your phone so your full body is visible. If issues persist, try restarting the app or checking for updates.',
    },
    {
      id: '8',
      category: 'Technical',
      question: 'How do I reset my password?',
      answer: 'On the login screen, tap "Forgot Password" and follow the instructions. You will receive a password reset link via email.',
    },
  ];

  const supportOptions = [
    {
      id: 'email',
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      icon: 'mail',
      color: COLORS.primary,
      action: () => Linking.openURL('mailto:support@karmaquest.com'),
    },
    {
      id: 'chat',
      title: 'Live Chat',
      description: 'Chat with our support team',
      icon: 'chatbubbles',
      color: COLORS.success,
      action: () => Alert.alert('Coming Soon', 'Live chat will be available soon'),
    },
    {
      id: 'community',
      title: 'Community Forum',
      description: 'Ask questions in our community',
      icon: 'people',
      color: COLORS.info,
      action: () => Alert.alert('Community', 'Community forum will open in browser'),
    },
    {
      id: 'faq',
      title: 'FAQ',
      description: 'Browse frequently asked questions',
      icon: 'help-circle',
      color: COLORS.warning,
      action: () => {
        // Scroll to FAQ section (already visible)
        Alert.alert('FAQ', 'See the FAQ section below');
      },
    },
  ];

  const handleSendMessage = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setContactSubject('');
      setContactMessage('');
      Alert.alert(
        'Message Sent',
        'Thank you for contacting us! We will respond to your message within 24 hours.',
        [{ text: 'OK' }]
      );
    }, 1500);
  };

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Support Options */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help</Text>
          <View style={styles.supportGrid}>
            {supportOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.supportCard}
                onPress={option.action}
              >
                <View style={[styles.supportIcon, { backgroundColor: option.color + '20' }]}>
                  <Ionicons name={option.icon as any} size={28} color={option.color} />
                </View>
                <Text style={styles.supportTitle}>{option.title}</Text>
                <Text style={styles.supportDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Contact Form */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Send Us a Message</Text>
          <Text style={styles.sectionDescription}>
            Have a specific question or issue? Send us a message and we'll get back to you soon.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject *</Text>
            <TextInput
              style={styles.input}
              value={contactSubject}
              onChangeText={setContactSubject}
              placeholder="What can we help you with?"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={contactMessage}
              onChangeText={setContactMessage}
              placeholder="Describe your issue or question in detail..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.contactInfo}>
            <Ionicons name="mail" size={16} color={COLORS.textSecondary} />
            <Text style={styles.contactInfoText}>
              Replies will be sent to: {user?.email}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="send" size={20} color={COLORS.white} />
                <Text style={styles.sendButtonText}>Send Message</Text>
              </>
            )}
          </TouchableOpacity>
        </Card>

        {/* FAQ Section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {['Getting Started', 'Workouts', 'Account', 'Technical'].map((category) => (
            <View key={category} style={styles.faqCategory}>
              <Text style={styles.categoryTitle}>{category}</Text>
              {faqs
                .filter((faq) => faq.category === category)
                .map((faq) => (
                  <TouchableOpacity
                    key={faq.id}
                    style={styles.faqItem}
                    onPress={() => toggleFAQ(faq.id)}
                  >
                    <View style={styles.faqHeader}>
                      <Text style={styles.faqQuestion}>{faq.question}</Text>
                      <Ionicons
                        name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={COLORS.textSecondary}
                      />
                    </View>
                    {expandedFAQ === faq.id && (
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    )}
                  </TouchableOpacity>
                ))}
            </View>
          ))}
        </Card>

        {/* App Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>November 2025</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Developer</Text>
            <Text style={styles.infoValue}>KarmaQuest Team</Text>
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openURL('https://karmaquest.com')}
          >
            <Text style={styles.linkButtonText}>Visit Our Website</Text>
            <Ionicons name="open-outline" size={16} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Alert.alert('Rate Us', 'This will open your app store to rate KarmaQuest')}
          >
            <Text style={styles.linkButtonText}>Rate KarmaQuest</Text>
            <Ionicons name="star" size={16} color={COLORS.warning} />
          </TouchableOpacity>
        </Card>

        {/* Quick Links */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => Alert.alert('Tutorial', 'This will open the app tutorial')}
          >
            <Ionicons name="play-circle" size={24} color={COLORS.primary} />
            <Text style={styles.quickLinkText}>Watch Tutorial Videos</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => Alert.alert('Tips', 'This will show fitness tips')}
          >
            <Ionicons name="bulb" size={24} color={COLORS.warning} />
            <Text style={styles.quickLinkText}>Fitness Tips & Guides</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => Alert.alert('Report', 'Report a bug or issue')}
          >
            <Ionicons name="bug" size={24} color={COLORS.error} />
            <Text style={styles.quickLinkText}>Report a Bug</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  supportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  supportCard: {
    width: '48%',
    margin: SPACING.xs,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  supportIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  supportTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  supportDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  contactInfoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 12,
  },
  sendButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  faqCategory: {
    marginBottom: SPACING.md,
  },
  categoryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  faqItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  faqAnswer: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  linkButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.primary,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  quickLinkText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
});
