import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.ch!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Invoice = {
  id: string;
  user_id: string;
  client_id: string | null;
  invoice_number: string;
  type: 'invoice' | 'quote';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  notes: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceItem = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type Client = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  business_name: string | null;
  business_phone: string | null;
  business_address: string | null;
  logo_url: string | null;
  bank_name: string | null;
  account_number: string | null;
  is_pro: boolean;
  created_at: string;
};