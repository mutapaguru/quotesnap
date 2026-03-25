# QuoteSnap Mobile 📋

Professional invoicing & quoting app for South African businesses. Built with Expo + React Native + Supabase + Paystack.

## Features
- 🔐 Email/password & magic link authentication
- 📄 Create invoices & quotes with dynamic line items
- 👥 Client management (CRUD)
- 💳 Paystack payment integration
- 📱 Share invoices via WhatsApp or any app
- 📊 Dashboard with revenue stats
- ⚙️ Business settings & profile
- 🔒 Row Level Security on all data

## Revenue Model
- **Free tier**: 5 invoices/month, 2% platform fee
- **Pro**: R99/month, unlimited invoices, 0% fee

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Expo account: https://expo.dev

### 2. Install dependencies
```bash
cd quotesnap-mobile
npm install
```

### 3. Set up Supabase
1. Create a project at https://supabase.com
2. Go to SQL Editor → paste contents of `supabase/schema.sql` → Run
3. Copy your project URL and anon key from Settings → API

### 4. Set up Paystack
1. Sign up at https://paystack.com
2. Go to Settings → API Keys & Webhooks
3. Copy your test public key and secret key

### 5. Configure keys
Edit `lib/supabase.ts`:
```typescript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

Edit `lib/paystack.ts`:
```typescript
export const PAYSTACK_PUBLIC_KEY = 'pk_test_xxx';
export const PAYSTACK_SECRET_KEY = 'sk_test_xxx';
```

### 6. Run locally
```bash
npx expo start
```
Scan the QR code with Expo Go on your phone.

### 7. Build APK for Android testing
```bash
# Login to EAS
eas login

# Configure project (first time only)
eas build:configure

# Build APK (installs directly on device)
eas build --platform android --profile preview
```

This builds an `.apk` file you can download and install directly on your Android phone.

### 8. Build for iOS (requires Apple Developer account)
```bash
eas build --platform ios --profile preview
```

---

## File Structure
```
quotesnap-mobile/
├── app/
│   ├── _layout.tsx          # Root layout with AuthProvider
│   ├── index.tsx            # Welcome/landing screen
│   ├── auth/
│   │   ├── _layout.tsx
│   │   ├── login.tsx        # Email + password + magic link
│   │   └── register.tsx     # Sign up
│   ├── dashboard/
│   │   ├── _layout.tsx      # Tab navigation
│   │   ├── index.tsx        # Home with stats + recent invoices
│   │   ├── invoices.tsx     # Invoice list with search/filter
│   │   ├── clients.tsx      # Client list with CRUD modal
│   │   └── settings.tsx     # Business settings + sign out
│   └── invoices/
│       ├── _layout.tsx
│       ├── create.tsx       # Create invoice/quote
│       └── [id].tsx         # Invoice detail + share + status
├── components/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── StatCard.tsx
├── lib/
│   ├── supabase.ts          # Supabase client + types
│   ├── paystack.ts          # Paystack config + helpers
│   └── auth-context.tsx     # Auth context + protected routes
├── supabase/
│   └── schema.sql           # Full DB schema with RLS
├── app.json                 # Expo config
├── eas.json                 # EAS Build profiles
├── package.json
└── tsconfig.json
```

## Tech Stack
- **Expo SDK 52** + Expo Router v4
- **React Native 0.76**
- **Supabase** (auth + database + RLS)
- **Paystack** (payments)
- **TypeScript**
