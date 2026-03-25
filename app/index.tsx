import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth-context';

export default function Welcome() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>QuoteSnap</Text>
      </View>
    );
  }

  if (user) {
    router.replace('/dashboard');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.logo}>📋</Text>
          <Text style={styles.title}>QuoteSnap</Text>
          <Text style={styles.subtitle}>
            Create professional invoices & quotes in seconds. Get paid faster.
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem emoji="⚡" text="Create invoices in under 30 seconds" />
          <FeatureItem emoji="💳" text="Accept payments via Paystack" />
          <FeatureItem emoji="📱" text="Share via WhatsApp instantly" />
          <FeatureItem emoji="📊" text="Track payments & revenue" />
        </View>

        <View style={styles.actions}>
          <Button title="Get Started" onPress={() => router.push('/auth/register')} />
          <Button
            title="I already have an account"
            variant="outline"
            onPress={() => router.push('/auth/login')}
            style={{ marginTop: 12 }}
          />
        </View>

        <Text style={styles.pricing}>
          Free tier: 5 invoices/mo • Pro: R99/mo unlimited
        </Text>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loading: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#cbd5e1',
  },
  actions: {
    marginBottom: 24,
  },
  pricing: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 13,
  },
});
