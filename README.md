<div align="center">

# 🍸 barPOS

**Modern Point-of-Sale system designed specifically for cocktail bars**

[![CI/CD](https://github.com/latteine1217/barPOS/actions/workflows/ci.yml/badge.svg)](https://github.com/latteine1217/barPOS/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Powered-3ECF8E?logo=supabase)](https://supabase.com/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

A full-featured POS system built with React 19, TypeScript, and Supabase, supporting web, desktop (Electron), and mobile (Capacitor) platforms. Designed for cocktail bars with real-time synchronization, visual ordering interface, and comprehensive member management.

### Key Highlights

- 🎯 **Real-time Sync** - Multi-device synchronization powered by Supabase
- 🖥️ **Multi-platform** - Web, Desktop (Electron), Mobile (iOS/Android)
- 📊 **Analytics** - Comprehensive dashboard with revenue and order insights
- 👥 **Member System** - Credit-based member management with cup counting
- 🔒 **Security** - Row Level Security (RLS) with 16 security policies
- ⚡ **Performance** - 70-95% query performance improvement with 14 optimized indexes

---

## ✨ Features

### Core Functionality

| Module | Description |
|--------|-------------|
| **Dashboard** | Real-time overview of daily revenue, orders, and key metrics |
| **Table Management** | Visual layout editor with customizable table shapes and capacities |
| **Visual Ordering** | Intuitive ordering interface with category/spirit filtering |
| **Order Management** | Full order lifecycle: create, update, add items, checkout, and release |
| **Menu Management** | Complete menu control with categories, base spirits, and pricing |
| **Member System** | Cup-based credit system with balance tracking |
| **Analytics** | Advanced analytics with charts and performance insights |

### v4.1 Updates (2025-10-24)

#### 🔒 Database Security & Performance
- **Row Level Security (RLS)** - Full protection across all tables with 16 security policies
- **Schema Optimization** - Added `members` table, removed 3 duplicate columns
- **Performance Indexes** - 14 high-efficiency indexes covering all query patterns
  - Orders: 4 indexes (status, timestamp, table, composite)
  - Menu items: 4 indexes (category, availability, spirit, composite)
  - Tables: 4 indexes (status, number, available tables, order relations)
  - Members: 2 indexes (name, cup balance)
- **Migration Scripts** - 4 database migrations for smooth upgrades

#### 📊 Architecture Compatibility
- Complete schema validation against application type definitions
- 100% compatibility for core features (menu, orders, tables, members)
- Proper JSONB field handling and data format validation

### v4.3 Updates (2026-02-24)

#### 📈 Analytics Consistency
- **Unified Period Filtering** - All analytics views now consume the same `selectedPeriod` scope
- **Order Status Scope** - Revenue/product/customer/time analytics share the same order status filter (`completed` / `paid`)
- **Business Day Cutoff** - Cross-day statistics support configurable cutoff hour for business-day boundaries
- **Trend Gap Fill** - Missing trend buckets are backfilled with zero values for stable chart continuity

#### 🧩 Settings UX
- **Settings Layout Refresh** - Reorganized into a two-column responsive structure for clearer section hierarchy
- **Visual Readability** - Unified card spacing, labels, input contrast, and action grouping
- **Type Safety Cleanup** - Removed loose `any` usage in settings accent selection and chart formatter wrappers

#### ✅ Test Coverage Expansion
- Added integration tests for backup/restore, sync from Supabase, and store initialization paths
- Added service tests for analytics period + status filtering and business-day cutoff behavior

### v4.0 Updates

- **Member Credit System** - Cup-based prepaid system with add/deduct/set operations
- **Visual Ordering UX** - Redesigned interface with improved table/guest count placement
- **Unified Checkout** - Single scroll area for order details and notes
- **Service Fee** - Consolidated service fee configuration

---

## 🛠 Tech Stack

### Frontend
- **Framework** - React 19 with TypeScript 5.8
- **Build Tool** - Vite 7.0
- **Styling** - Tailwind CSS 3.4 + Headless UI
- **State Management** - Zustand 5.0
- **Data Fetching** - TanStack Query v5

### Backend & Database
- **Backend** - Supabase (PostgreSQL + Realtime)
- **Authentication** - Supabase Auth
- **Storage** - Multi-platform storage abstraction layer

### Forms & Validation
- **Form Library** - React Hook Form 7.61
- **Schema Validation** - Zod 4.0

### Testing & Quality
- **Testing Framework** - Vitest 3.2 + Testing Library
- **Coverage** - Vitest Coverage (v8 provider)
- **Type Checking** - TypeScript strict mode
- **Linting** - ESLint 9.30 with TypeScript plugin

### Multi-platform
- **Desktop** - Electron 37
- **Mobile** - Capacitor 7.4 (iOS/Android)
- **Cross-platform API** - Unified storage and platform detection

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or 20+
- npm or yarn
- Supabase account (for cloud sync features)

### Installation

```bash
# Clone the repository
git clone https://github.com/latteine1217/barPOS.git
cd barPOS

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the application.

### Supabase Setup

1. Create a new project at [Supabase](https://supabase.com/)
2. Execute the SQL schema from `cocktail-bar-supabase-setup.sql` in SQL Editor
3. Get your Project URL and API Key from project settings
4. Configure in application settings or create `.env` file

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

For detailed setup instructions, see [SUPABASE_GUIDE.md](./SUPABASE_GUIDE.md)

---

## 📜 Available Scripts

### Development

```bash
npm run dev              # Start Vite dev server
npm run dev:with-logs    # Dev server with log monitoring
npm run log-server       # Start log server only
```

### Build & Production

```bash
npm run build            # Build for production
npm run preview          # Preview production build
npm run build:analyze    # Build with bundle analyzer
```

### Code Quality

```bash
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
```

### Testing

```bash
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Generate coverage report
npm run test:ui          # Open Vitest UI
```

### Desktop (Electron)

```bash
npm run electron-dev     # Start Electron in development
npm run electron-build   # Build and run Electron
npm run dist             # Build Electron distributables
npm run dist-mac         # Build for macOS
npm run dist-win         # Build for Windows
npm run dist-linux       # Build for Linux
```

### Mobile (Capacitor)

```bash
# Setup
npm run mobile:setup     # Add iOS and Android platforms

# iOS
npm run cap:run:ios      # Build and run on iOS
npm run cap:open:ios     # Open in Xcode

# Android
npm run cap:run:android  # Build and run on Android
npm run cap:open:android # Open in Android Studio

# Sync
npm run cap:sync         # Sync web assets to native projects
```

---

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx           # Main dashboard
│   ├── Tables.tsx              # Table management
│   ├── TableLayoutEditor.tsx   # Visual table editor
│   ├── VisualOrderingInterface.tsx  # Ordering interface
│   ├── Members.tsx             # Member management
│   ├── Menu.tsx                # Menu management
│   ├── Analytics.tsx           # Analytics dashboard
│   ├── Settings.tsx            # Settings panel
│   ├── Charts/                 # Chart components
│   ├── DevTools/               # Development tools
│   └── ErrorBoundary/          # Error handling
│
├── stores/              # Zustand state stores
│   ├── appStore.ts             # Application state
│   ├── orderStore.ts           # Order management
│   ├── tableStore.ts           # Table state
│   ├── menuStore.ts            # Menu state
│   ├── membersStore.ts         # Member data
│   └── settingsStore.ts        # User preferences
│
├── hooks/               # Custom React hooks
│   ├── business/               # Business logic hooks
│   ├── core/                   # Core functionality hooks
│   ├── ui/                     # UI-related hooks
│   └── utils/                  # Utility hooks
│
├── services/            # Service layer
│   ├── supabaseService.ts      # Supabase integration
│   ├── analyticsService.ts     # Analytics logic
│   ├── storageService.ts       # Multi-platform storage
│   ├── loggerService.ts        # Logging service
│   └── consoleInterceptorService.ts  # Console interception
│
├── types/               # TypeScript type definitions
│   ├── core/                   # Core type definitions
│   ├── index.ts                # Main type exports
│   └── global.d.ts             # Global type declarations
│
├── utils/               # Utility functions
│   ├── cacheManager.ts         # Cache management
│   ├── chartHelpers.ts         # Chart utilities
│   ├── dataAnalysis.ts         # Data analysis helpers
│   └── performance.ts          # Performance utilities
│
└── test/                # Test files
    ├── components/             # Component tests
    ├── hooks/                  # Hook tests
    ├── services/               # Service tests
    └── setup.ts                # Test configuration
```

---

## 🧪 Testing & Quality

### Test Coverage Guidelines

| Layer | Target Coverage |
|-------|----------------|
| Services | 95%+ |
| Business Logic | 90%+ |
| UI Components | 80%+ |

### Running Tests

```bash
# Run all tests
npm run test:run

# Watch mode for development
npm run test

# Generate coverage report
npm run test:coverage

# Open interactive UI
npm run test:ui
```

### Code Quality

- TypeScript strict mode enabled
- ESLint with TypeScript rules
- Automated type checking in CI/CD
- Pre-commit hooks recommended (can be added with Husky)

---

## 📚 Documentation

- [Supabase Setup Guide](./SUPABASE_GUIDE.md) - Database configuration and migration
- [API Documentation](./docs/API.md) - Service layer API reference (if available)
- [Contributing Guidelines](#-contributing) - How to contribute to this project

---

## 🔄 Version History

### [v4.5] - 2026-05-18

Hardening release driven by 8 rounds of multi-disciplinary code review
(frontend / UI-UX / backend specialists) and 7 sprint iterations.
Final scores: Backend 9.0/10 · UI-UX 8.5/10 · Frontend grade A-.

#### Data Integrity & Correctness (4 P0)
- **Order atomicity**: `addOrderWithTableUpdate` now returns `boolean` with rollback on validation / missing-table / table-update failure — fixes orphaned orders and tables
- **Cloud sync no longer overwrites local**: `syncFromSupabase` switched from `setOrders(remote)` to `mergeByUpdatedAt`, with confirm dialog explaining merge rules
- **Supabase serialization fixed**: `menu_items.ingredients` (TEXT[]) and `orders.items` / `tables.position` (JSONB) no longer double-encoded via `serializeJson` — cloud menu sync now works
- **Analytics revenue tip-aware**: 7 callsites (`analyticsService`, `useDashboard`, `dataAnalysis` RFM/Trends/Seating/CLV, `useTodayStats`, `History.statistics`) unified through `orderMath.sumOrderRevenue` (excludes tip and cancelled)

#### Schema & State Fixes (9 P1)
- `Order` type gained `tip` / `adjustment` fields with full Supabase round-trip
- `orderStore.updateOrder` whitelist expanded to 14 fields (was missing tip/adjustment/customerId/etc.)
- `VisualOrderingInterface` now restores `tip` / `adjustment` from existing order
- `clearAllData` fixed persist key typo (`menu-items` → `menu-store`) and added members-store cleanup
- `appStore.initialize` now hydrates `membersStore` (was missing → first-paint zero-cup race)
- `ErrorBoundary` errorId moved into state to avoid render-time `Date.now()`

#### A11y, Currency & UI Consistency (6 P2)
- `formatCurrency` utility unifies all monetary display as `NT$ X,XXX`; chart Y-axes use `currencyAxis` (no prefix) to prevent tick overflow
- `prefers-reduced-motion` global override for all `hover:scale-*` (was leaking through `@layer` ordering)
- `MetricCard` colors moved to JIT-safe Record (dynamic `text-${color}-400` was being purged)
- `text-white` in History (21) and EnhancedAnalytics (26) replaced with `var(--text-*)` for light-theme readability
- `ui/Input` + `ui/Select` gained `useId` + `htmlFor` + `aria-invalid` + `aria-describedby` + `role="alert"` — all callers (Menu / Tables / Settings / etc.) automatically benefit
- Dashboard removed hardcoded `+12% / +8% 較昨日` fake delta strings

#### Dead Code Cleanup
- Removed legacy `Analytics.tsx` (status filter mismatch with `EnhancedAnalytics`)
- Removed 30+ unreferenced files (hooks barrel, DevTools/*, types/core/*, etc.)
- Removed `useNetworkStatus.simulateApiCall` 5% random failure injection (prod-bundle bug)

#### Testing
- 49 → 63 tests (+14): syncService unit tests (9 cases) + appStore rollback tests (5 cases)
- All type-check / lint / build / tests green

### [v4.3] - 2026-02-24
- **Analytics**: Unified `selectedPeriod` + order status filtering across all analysis views
- **Business Day**: Added cutoff-aware cross-day split and trend gap-filling
- **Settings**: Reworked settings page layout to responsive two-column information architecture
- **Quality**: Added high-value integration/service tests for sync, backup/restore, store init, and analytics cutoff scenarios

### [v4.2] - 2025-10-29
- **Branding**: Updated project name to barPOS
- **CI/CD**: Fixed deprecated GitHub Actions (upgraded to v4)
- **Storage**: Enhanced Supabase storage mechanism
- **Assets**: Added application icons for desktop builds
- **Documentation**: Restructured README to professional GitHub standards

### [v4.1] - 2025-10-24
- **Security**: Full RLS implementation with 16 security policies
- **Performance**: 14 indexes with 70-95% query improvement
- **Schema**: Added members table, removed duplicate columns
- **Validation**: Complete type compatibility check

### [v4.0] - Previous Release
- Member credit system (cup-based)
- Visual ordering UX redesign
- Unified checkout experience
- Service fee consolidation

### [v3.3] - Previous Release
- Theme and accent color customization
- Glass morphism effects
- Dashboard time boundaries
- Backup/restore functionality

For complete changelog, see [CHANGELOG.md](./CHANGELOG.md) (if available)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Before Submitting

1. Ensure all tests pass: `npm run test:run`
2. Run linting: `npm run lint`
3. Check types: `npm run type-check`
4. Verify build succeeds: `npm run build`

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes with clear messages
4. Push to your fork: `git push origin feature/your-feature`
5. Open a Pull Request with description and test results

### Coding Standards

- Follow existing code style and naming conventions
- Maintain single responsibility principle
- Add tests for new features
- Update documentation as needed
- Avoid unnecessary dependencies

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

This project was developed with assistance from:
- [GitHub Copilot](https://github.com/features/copilot)
- [Claude Code](https://claude.ai/)

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/latteine1217/barPOS/issues)
- **Discussions**: [GitHub Discussions](https://github.com/latteine1217/barPOS/discussions)

---

<div align="center">

**[⬆ back to top](#-barpos)**

Made with ❤️ for cocktail bars

</div>
