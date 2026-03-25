import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/paystack';
import { StatCard } from '@/components/StatCard';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    pending: 0,
    overdue: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (invoices) {
      const paid = invoices.filter((i) => i.status === 'paid');
      const pending = invoices.filter((i) => i.status === 'sent');
      const overdue = invoices.filter((i) => i.status === 'overdue');

      setStats({
        totalInvoices: invoices.length,
        totalRevenue: paid.reduce((sum, i) => sum + i.total, 0),
        pending: pending.length,
        overdue: overdue.length,
      });

      setRecentInvoices(invoices.slice(0, 5));
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const statusColor: Record<string, string> = {
    draft: '#94a3b8',
    sent: '#f59e0b',
    paid: '#22c55e',
    overdue: '#ef4444',
    cancelled: '#6b7280',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/invoices/create')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon="cash"
            color="#22c55e"
          />
          <View style={{ width: 12 }} />
          <StatCard
            title="Invoices"
            value={stats.totalInvoices.toString()}
            icon="document-text"
            color="#2563eb"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Pending"
            value={stats.pending.toString()}
            icon="time"
            color="#f59e0b"
          />
          <View style={{ width: 12 }} />
          <StatCard
            title="Overdue"
            value={stats.overdue.toString()}
            icon="alert-circle"
            color="#ef4444"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Invoices</Text>
            <TouchableOpacity onPress={() => router.push('/dashboard/invoices')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {recentInvoices.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No invoices yet</Text>
              <TouchableOpacity onPress={() => router.push('/invoices/create')}>
                <Text style={styles.emptyAction}>Create your first invoice →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentInvoices.map((invoice) => (
              <TouchableOpacity
                key={invoice.id}
                style={styles.invoiceRow}
                onPress={() => router.push(`/invoices/${invoice.id}`)}
              >
                <View style={styles.invoiceLeft}>
                  <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
                  <Text style={styles.invoiceDate}>
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.invoiceRight}>
                  <Text style={styles.invoiceAmount}>{formatCurrency(invoice.total)}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: (statusColor[invoice.status] || '#94a3b8') + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: statusColor[invoice.status] || '#94a3b8' },
                      ]}
                    >
                      {invoice.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  email: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  section: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  seeAll: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  empty: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 8,
  },
  emptyAction: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '600',
  },
  invoiceRow: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  invoiceLeft: {},
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  invoiceDate: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  invoiceRight: {
    alignItems: 'flex-end',
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
