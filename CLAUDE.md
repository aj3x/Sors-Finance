# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A local-first Next.js web application for budget tracking and bank transaction categorization. **All processing happens client-side** — no transaction data is sent to servers. Categories persist in localStorage; transaction data lives only in React state and clears on refresh.

**Theme**: shadcn/ui Maia style with zinc base color and lime accent.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture

### App Structure (Next.js App Router)

- `/` - Dashboard with charts (income vs expenses, category breakdown)
- `/transactions` - Import history + transaction categorizer wizard
- `/budget` - Budget categories with spending progress

Sidebar navigation in `components/AppSidebar.tsx`, wrapped by `SidebarLayout.tsx`.

### Transaction Import Flow

1. **File Upload** → Bank type detected from filename prefix (`cibc*` = CIBC, `Summary*` = AMEX)
2. **Parsing** → Bank-specific parsers convert to unified `Transaction` format
3. **Categorization** → Keyword matching against categories (case-insensitive, partial match)
4. **Resolution** → User resolves conflicts (multi-category matches) and unassigned transactions
5. **Results** → View transactions grouped by category with totals

### Key Modules

- `lib/parsers/cibc.ts` - CIBC CSV/Excel parser (no headers, date format MM/DD/YYYY)
- `lib/parsers/amex.ts` - AMEX Excel parser (data starts row 12, date format DD Mon. YYYY)
- `lib/categorizer.ts` - Keyword matching and categorization logic
- `lib/categoryStore.ts` - localStorage persistence for categories
- `lib/types.ts` - TypeScript interfaces (`Transaction`, `Category`, etc.)
- `lib/dummyData.ts` - Sample data for dashboard/budget (development)

### Bank Format Details

**CIBC**: Column B (index 1) is the match field. No headers.

**AMEX**: Column J (index 9) "Additional Information" is the match field. Data starts at row 13 (row 12 is headers). Positive amounts = expenses, negative = payments.

### UI Components

Located in `components/`:
- `AppSidebar.tsx` - Main navigation sidebar
- `SidebarLayout.tsx` - Layout wrapper with SidebarProvider
- `TransactionImporter.tsx` - Full import wizard (upload → resolve → results)
- `FileUpload.tsx` - Drag/drop file upload with bank detection
- `CategoryManager.tsx` - CRUD for categories with drag-to-reorder (dnd-kit)
- `ConflictResolver.tsx` - Handle transactions matching multiple categories
- `UnassignedList.tsx` - Assign categories to unmatched transactions
- `ResultsView.tsx` - Categorized results with date filtering

Radix UI primitives in `components/ui/` (shadcn/ui Maia style). Charts use Recharts via shadcn/ui chart component.

### State Management

- React useState/useEffect only
- Categories: localStorage via `categoryStore.ts`
- Transactions: React state (ephemeral, cleared on refresh)

## Path Alias

`@/*` maps to `./` (configured in tsconfig.json) - no `src/` prefix in this project.

## Dependencies of Note

- `papaparse` - CSV parsing
- `xlsx` - Excel parsing
- `@dnd-kit/*` - Drag and drop for category reordering
- `sonner` - Toast notifications
- `recharts` - Charts (via shadcn/ui)
