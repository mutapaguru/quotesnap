import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase, Invoice, Client } from '@/lib/supabase';
import { formatCurrency } from '@/lib/paystack';
import { Button } from '@/components/Button';

export default function InvoiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setInvoice(data as Invoice);
          if (data.client_id) {
            supabase
              .from('clients')
              .select('*')
              .eq('id', data.client_id)
              .single()
              .then(({ data: c }) => {
                if (c) setClient(c as Client);
              });
          }
        }
      });
  }, [id]);

  if (!invoice) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor: Record<string, string> = {
    draft: '#94a3b8',
    sent: '#f59e0b',
    paid: '#22c55e',
    overdue: '#ef4444',
    cancelled: '#6b7280',
  };

  const updateStatus = async (status: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', invoice.id);
    if (!error) {
      setInvoice({ ...invoice, status: status as Invoice['status'] });
    }
  };

  const handleMarkSent = () => updateStatus('sent');
  const handleMarkPaid = () => {
    Alert.alert('Mark as Paid', 'Confirm this invoice has been paid?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Paid', onPress: () => updateStatus('paid') },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Invoice', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('invoices').delete().eq('id', invoice.id);
          router.back();
        },
      },
    ]);
  };

  const shareWhatsApp = () => {
    // In production, this would link to your deployed pay page
    const payUrl = `https://your-app.vercel.app/pay/${invoice.id}`;
    const message = `Hi${client ? ` ${client.name}` : ''}! Here's your ${invoice.type} ${invoice.invoice_number} for ${formatCurrency(invoice.total)}.\n\nPay here: ${payUrl}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed');
    });
  };

  const shareGeneric = async () => {
    const payUrl = `https://your-app.vercel.app/pay/${invoice.id}`;
    await Share.share({
      message: `${invoice.type === 'invoice' ? 'Invoice' : 'Quote'} ${invoice.invoice_number}: ${formatCurrency(invoice.total)}\n\nPay here: ${payUrl}`,
    });
  };

  const items = Array.isArray(invoice.items) ? invoice.items : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{invoice.invoice_number}</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status & Meta */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Status</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: (statusColor[invoice.status] || '#94a3b8') + '20' },
              ]}
            >
              <Text
                style={[styles.badgeText, { color: statusColor[invoice.status] || '#94a3b8' }]}
              >
                {invoice.status}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Type</Text>
            <Text style={styles.metaValue}>{invoice.type}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Created</Text>
            <Text style={styles.metaValue}>
              {new Date(invoice.created_at).toLocaleDateString()}
            </Text>
          </View>
          {invoice.due_date && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Due</Text>
              <Text style={styles.metaValue}>
                {new Date(invoice.due_date).toLocaleDateString()}
              </Text>
            </View>
          )}
          {client && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Client</Text>
              <Text style={styles.metaValue}>{client.name}</Text>
            </View>
          )}
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemMeta}>
                  {item.quantity} × {formatCurrency(item.unit_price)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({invoice.tax_rate}%)</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.tax_amount)}</Text>
          </View>
          {invoice.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={[styles.totalValue, { color: '#ef4444' }]}>
                -{formatCurrency(invoice.discount)}
              </Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.totalFinal]}>
            <Text style={styles.totalFinalLabel}>Total</Text>
            <Text style={styles.totalFinalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {invoice.status === 'draft' && (
            <Button title="Mark as Sent" onPress={handleMarkSent} style={{ marginBottom: 10 }} />
          )}
          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <Button title="Mark as Paid" onPress={handleMarkPaid} style={{ marginBottom: 10 }} />
          )}
          <View style={styles.shareRow}>
            <TouchableOpacity style={styles.shareBtn} onPress={shareWhatsApp}>
              <Ionicons name="logo-whatsapp" size={22} color="#25d366" />
              <Text style={styles.shareBtnText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={shareGeneric}>
              <Ionicons name="share-outline" size={22} color="#2563eb" />
              <Text style={[styles.shareBtnText, { color: '#2563eb' }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, color: '#94a3b8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  content: { paddingHorizontal: 20 },
  metaCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  metaLabel: { fontSize: 14, color: '#64748b' },
  metaValue: { fontSize: 14, fontWeight: '500', color: '#0f172a', textTransform: 'capitalize' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemDesc: { fontSize: 15, fontWeight: '500', color: '#0f172a' },
  itemMeta: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  itemTotal: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  totals: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalLabel: { fontSize: 14, color: '#64748b' },
  totalValue: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  totalFinal: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 6,
    paddingTop: 10,
  },
  totalFinalLabel: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  totalFinalValue: { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  notesLabel: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  notesText: { fontSize: 15, color: '#0f172a', lineHeight: 22 },
  actions: { marginBottom: 16 },
  shareRow: {
    flexDirection: 'row',
    gap: 12,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  shareBtnText: { fontSize: 15, fontWeight: '600', color: '#25d366' },
});
