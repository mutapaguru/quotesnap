import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase, Profile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    business_name: '',
    business_phone: '',
    business_address: '',
    bank_name: '',
    account_number: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data as Profile);
          setForm({
            business_name: data.business_name || '',
            business_phone: data.business_phone || '',
            business_address: data.business_address || '',
            bank_name: data.bank_name || '',
            account_number: data.account_number || '',
          });
        }
      });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: form.business_name || null,
          business_phone: form.business_phone || null,
          business_address: form.business_address || null,
          bank_name: form.bank_name || null,
          account_number: form.account_number || null,
        })
        .eq('id', user!.id);
      if (error) throw error;
      Alert.alert('Saved', 'Business settings updated');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Plan</Text>
            <View style={[styles.planBadge, profile?.is_pro && styles.proBadge]}>
              <Text style={[styles.planText, profile?.is_pro && styles.proText]}>
                {profile?.is_pro ? 'Pro' : 'Free'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Info</Text>
          <Input
            label="Business Name"
            value={form.business_name}
            onChangeText={(t) => setForm({ ...form, business_name: t })}
            placeholder="Your business name"
          />
          <Input
            label="Phone"
            value={form.business_phone}
            onChangeText={(t) => setForm({ ...form, business_phone: t })}
            keyboardType="phone-pad"
            placeholder="+27 ..."
          />
          <Input
            label="Address"
            value={form.business_address}
            onChangeText={(t) => setForm({ ...form, business_address: t })}
            placeholder="Business address"
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Banking</Text>
          <Input
            label="Bank Name"
            value={form.bank_name}
            onChangeText={(t) => setForm({ ...form, bank_name: t })}
            placeholder="e.g. FNB, Capitec"
          />
          <Input
            label="Account Number"
            value={form.account_number}
            onChangeText={(t) => setForm({ ...form, account_number: t })}
            keyboardType="numeric"
            placeholder="Your account number"
          />
        </View>

        <Button title="Save Settings" onPress={handleSave} loading={saving} />

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 24 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: { fontSize: 15, color: '#64748b' },
  infoValue: { fontSize: 15, color: '#0f172a', fontWeight: '500' },
  planBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proBadge: {
    backgroundColor: '#dbeafe',
  },
  planText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  proText: { color: '#2563eb' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
});
