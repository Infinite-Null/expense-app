# Spendly — Premium Apple-Inspired Personal Expense Tracker

Spendly is a production-grade personal expense tracking web application built with **Next.js (App Router)**, **TypeScript**, **Supabase PostgreSQL**, **Recharts**, and an **Apple Human Interface Guidelines** design system.

---

## ✨ Features

- **Apple-Inspired Design System**: Clean typography, glassmorphism surfaces, subtle borders, refined micro-interactions, and responsive layout for desktop and mobile.
- **Secure Authentication**: Supabase Auth with server-side cookie sessions, RLS (Row Level Security), and secure route protection.
- **Comprehensive Expense Management**:
  - Add, edit, duplicate, and delete transactions.
  - Multi-attribute filtering (date range, categories, tags, payment method, amount).
  - Search with debounce across titles, merchants, notes, and descriptions.
  - Paginated transactions list and mobile-optimized card layout.
- **Advanced Financial Analytics**:
  - Spending trends over time (daily, weekly, monthly, quarterly, yearly).
  - Interactive charts (area trends, donut category share, horizontal bar rankings).
  - Period-over-period comparisons (e.g. this month vs. last month) with zero-baseline handling.
  - Key spending metrics (average transaction, daily average, top spending category, largest expense).
  - Tag analytics with multi-tag allocation protection.
- **Tags & Categories**:
  - 14 default system categories + custom user categories.
  - Custom color-coded tags with badge previews.
  - Safe category and tag deletion with cascade handling.
- **Import & Export**:
  - Full CSV spreadsheet export and JSON relational snapshot backup.
  - Drag-and-drop CSV importer with column mapping, preview validation, duplicate detection, and completion reporting.
  - Spreadsheet formula injection protection (`=`, `+`, `-`, `@`).
- **PWA (Progressive Web App)**:
  - Web App Manifest (`/manifest.webmanifest`), 192x192 & 512x512 icons, and maskable assets.
  - Service worker with offline fallback page (`public/offline.html`).
  - Online/offline connection tracking.
- **Theming & Regional Preferences**:
  - Light mode, Dark mode, and System preference synchronization with zero-flash rendering.
  - Multi-currency support (INR ₹, USD $, EUR €, GBP £, JPY ¥, CAD, AUD, SGD).
  - Locale-aware number and date formatting.

---

## 🚀 Setup & Installation Guide

Follow these steps to configure and run Spendly locally:

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+ (v24 supported)
- **Package Manager**: npm, pnpm, or yarn
- **Supabase Account**: A free account at [supabase.com](https://supabase.com)

---

### 2. Configure Supabase Backend

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and create a **New Project**.
2. Once the project is provisioned, navigate to the **SQL Editor** tab from the left sidebar.
3. Open [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql) in this repository, copy its entire contents, paste it into the Supabase SQL Editor, and click **Run**.
   - This creates the `profiles`, `categories`, `tags`, `expenses`, and `expense_tags` tables.
   - It sets up automatic default categories and user profile triggers.
   - It configures Row Level Security (RLS) policies so each user's financial records are strictly isolated.
4. Navigate to **Project Settings > API** in your Supabase dashboard and copy:
   - **Project URL**
   - **Project API Anon Key**

---

### 3. Configure Local Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and paste your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### 4. Install Dependencies & Start the Development Server

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Visit `/signup` to create a new user account.
- Your user profile and default preferences will be initialized automatically in Supabase.

---

### 5. Production Build Validation

To compile the optimized production bundle:

```bash
npm run build
npm run start
```

---

## 📁 Project Architecture

```
├── app/
│   ├── (app)/                    # Authenticated protected application routes
│   │   ├── analytics/            # Spending breakdown & interactive charts
│   │   ├── categories/           # Category management & system defaults
│   │   ├── dashboard/            # Overview metrics, trends & quick actions
│   │   ├── expenses/             # Filterable transaction list & CRUD
│   │   │   ├── [id]/             # View & edit expense details
│   │   │   └── new/              # Add new expense page
│   │   ├── import-export/        # CSV import wizard & JSON backups
│   │   ├── settings/             # User profile, theme & currency preferences
│   │   └── tags/                 # Tag management & color badge editor
│   ├── (auth)/                   # Authentication flows
│   │   ├── login/                # Email & password login
│   │   ├── signup/               # Registration & validation
│   │   └── forgot-password/      # Password recovery
│   ├── globals.css               # Apple design tokens, CSS variables & typography
│   ├── layout.tsx                # Root layout with theme, PWA & toast providers
│   └── manifest.ts               # Web App Manifest for PWA
├── components/
│   ├── expenses/                 # Form & transaction components
│   ├── layout/                   # Sidebar navigation & Mobile bottom bar
│   ├── providers/                # ThemeProvider & PwaProvider
│   └── ui/                       # Apple-inspired Buttons, Inputs, Dialogs, Toaster
├── lib/
│   ├── supabase/                 # Client, Server, and Middleware Supabase clients
│   ├── types/                    # PostgreSQL Database TypeScript interfaces
│   ├── utils/                    # Currency math, dates, CSV parser & classes
│   └── validations/              # Zod validation schemas
├── public/                       # PWA icons (192, 512, maskable) & offline.html
└── supabase/
    └── migrations/               # PostgreSQL schema & RLS policies
```
