import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase, Client, InvoiceItem } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/paystack';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export default function CreateInvoice() {
  const { user } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<'invoice' | 'quote'>('invoice');
  const [clientId, setClientId] = useState<string | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 },
  ]);
  const [taxRate, setTaxRate] = useState('15');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
      .then(({ data }) => {
        if (data) setClients(data as Client[]);
      });
  }, [user]);

  const updateItem = (index: number, field: keyof InvoiceItem, value: string) => {
    const updated = [...items];
    if (field === 'description') {
      updated[index].description = value;
    } else {
      const num = parseFloat(value) || 0;
      (updated[index] as any)[field] = num;
    }
    updated[index].total = updated[index].quantity * updated[index].unit_price;
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const taxAmount = subtotal * (parseFloat(taxRate) || 0) / 100;
  const discountAmount = parseFloat(discount) || 0;
  const total = subtotal + taxAmount - discountAmount;

  const selectedClient = clients.find((c) => c.id === clientId);

  const handleSave = async () => {
    if (items.some((i) => !i.description.trim())) {
      Alert.alert('Error', 'All items must have a description');
      return;
    }
    if (total <= 0) {
      Alert.alert('Error', 'Total must be greater than zero');
      return;
    }

    setSaving(true);
    try {
      // Get next invoice number
      const prefix = type === 'invoice' ? 'INV' : 'QT';
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('type', type);

      const num = ((count || 0) + 1).toString().padStart(4, '0');
      const invoiceNumber = `${prefix}-${num}`;

      const { error } = await supabase.from('invoices').insert({
        user_id: user!.id,
        client_id: clientId,
        invoice_number: invoiceNumber,
        type,
        status: 'draft',
        items,
        subtotal,
        tax_rate: parseFloat(taxRate) || 0,
        tax_amount: taxAmount,
        discount: discountAmount,
        total,
        notes: notes || null,
        due_date: dueDate || null,
      });

      if (error) throw error;
      Alert.alert('Success', `${type === 'invoice' ? 'Invoice' : 'Quote'} created!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New {type === 'invoice' ? 'Invoice' : 'Quote'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Type Toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'invoice' && styles.typeBtnActive]}
              onPress={() => setType('invoice')}
            >
              <Text style={[styles.typeText, type === 'invoice' && styles.typeTextActive]}>
                Invoice
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'quote' && styles.typeBtnActive]}
              onPress={() => setType('quote')}
            >
              <Text style={[styles.typeText, type === 'quote' && styles.typeTextActive]}>
                Quote
              </Text>
            </TouchableOpacity>
          </View>

          {/* Client */}
          <Text style={styles.sectionLabel}>Client</Text>
          <TouchableOpacity
            style={styles.clientPicker}
            onPress={() => setShowClientPicker(!showClientPicker)}
          >
            <Text style={selectedClient ? styles.clientSelected : styles.clientPlaceholder}>
              {selectedClient ? selectedClient.name : 'Select a client (optional)'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#94a3b8" />
          </TouchableOpacity>

          {showClientPicker && (
            <View style={styles.clientList}>
              <TouchableOpacity
                style={styles.clientOption}
                onPress={() => { setClientId(null); setShowClientPicker(false); }}
              >
                <Text style={styles.clientOptionText}>No client</Text>
              </TouchableOpacity>
              {clients.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.clientOption}
                  onPress={() => { setClientId(c.id); setShowClientPicker(false); }}
                >
                  <Text style={styles.clientOptionText}>{c.name}</Text>
                  {c.company && <Text style={styles.clientOptionSub}>{c.company}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Line Items */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Items</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemIndex}>Item {index + 1}</Text>
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(index)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
              <Input
                label="Description"
                value={item.description}
                onChangeText={(v) => updateItem(index, 'description', v)}
                placeholder="What is this for?"
              />
              <View style={styles.itemRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Input
                    label="Qty"
                    value={item.quantity.toString()}
                    onChangeText={(v) => updateItem(index, 'quantity', v)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Input
                    label="Unit Price (R)"
                    value={item.unit_price.toString()}
                    onChangeText={(v) => updateItem(index, 'unit_price', v)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <Text style={styles.itemTotal}>Line total: {formatCurrency(item.total)}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
            <Ionicons name="add-circle-outline" size={20} color="#2563eb" />
            <Text style={styles.addItemText}>Add item</Text>
          </TouchableOpacity>

          {/* Tax & Discount */}
          <View style={styles.itemRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label="Tax %"
                value={taxRate}
                onChangeText={setTaxRate}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input
                label="Discount (R)"
                value={discount}
                onChangeText={setDiscount}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Input
            label="Due Date"
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
          />

          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            multiline
            style={{ minHeight: 80 }}
          />

          {/* Totals */}
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({taxRate}%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={[styles.totalValue, { color: '#ef4444' }]}>
                  -{formatCurrency(discountAmount)}
                </Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.totalFinal]}>
              <Text style={styles.totalFinalLabel}>Total</Text>
              <Text style={styles.totalFinalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>

          <Button title="Create" onPress={handleSave} loading={saving} style={{ marginTop: 8 }} />
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  content: { paddingHorizontal: 20 },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: '#fff' },
  typeText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  typeTextActive: { color: '#0f172a' },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  clientPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  clientSelected: { fontSize: 15, color: '#0f172a' },
  clientPlaceholder: { fontSize: 15, color: '#94a3b8' },
  clientList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  clientOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  clientOptionText: { fontSize: 15, color: '#0f172a' },
  clientOptionSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemIndex: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  itemRow: { flexDirection: 'row' },
  itemTotal: { fontSize: 14, fontWeight: '600', color: '#2563eb', textAlign: 'right' },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    marginBottom: 16,
  },
  addItemText: { fontSize: 15, fontWeight: '600', color: '#2563eb' },
  totals: {
    backgroundColor: '#fff',
    borderRadius: 14,
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
  totalFinalLabel: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  totalFinalValue: { fontSize: 17, fontWeight: '700', color: '#2563eb' },
});
