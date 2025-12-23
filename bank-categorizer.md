# Bank Transaction Categorizer - Technical Specification

## Overview

A local-first Next.js web application for categorizing bank transactions from CSV/Excel files. Security is the top priority — all processing happens client-side with no data sent to external servers.

---

## Tech Stack

- **Framework**: Next.js (latest version)
- **Runtime**: Fully client-side processing (no API routes for transaction data)
- **File Parsing**: Use appropriate libraries for CSV and Excel parsing (e.g., `papaparse` for CSV, `xlsx` for Excel)
- **State Management**: React state (useState/useReducer) — no external state libraries needed
- **Styling**: Tailwind CSS or CSS Modules (developer preference)

---

## Data Persistence

### What Persists (gitignored JSON file)
- Categories and their keywords
- Store in: `/data/categories.json` (add to `.gitignore`)

### What Does NOT Persist
- Uploaded transaction data — cleared on page refresh
- Processed/sorted transactions — cleared on page refresh

### Category JSON Structure
```json
{
  "categories": [
    {
      "id": "uuid-1",
      "name": "Groceries",
      "keywords": ["LOBLAWS", "METRO", "SOBEYS", "FARM BOY"]
    },
    {
      "id": "uuid-2", 
      "name": "Subscriptions",
      "keywords": ["NETFLIX", "SPOTIFY", "DISNEY"]
    }
  ]
}
```

---

## Supported Bank Formats

### CIBC (filename starts with "cibc")
- **File type**: CSV or Excel
- **No headers** — data starts at row 1
- **Column mapping**:
  - Column A (index 0): Date
  - Column B (index 1): Name/Details — **USE THIS FOR KEYWORD MATCHING**
  - Column C (index 2): Money Out (debit)
  - Column D (index 3): Money In (credit)

**Example row**:
```
12/16/2025,Electronic Funds Transfer PREAUTHORIZED DEBIT Wealthsimple Investments Inc.,2500,
```

### AMEX (filename starts with "Summary")
- **File type**: Excel (.xlsx)
- **Data starts at row 12** (skip first 11 rows)
- **Headers present at row 12**
- **Column mapping**:
  - Column A: Date
  - Column B: Date Processed
  - Column C: Description
  - Column D: Amount (includes $ sign, needs parsing)
  - Column E-I: Other fields
  - Column J (index 9): Additional Information — **USE THIS FOR KEYWORD MATCHING**

**Amount parsing rules**:
- Positive amounts (e.g., `$23.49`) = Money OUT (expense)
- Negative amounts (e.g., `-$673.37`) = Money IN (payment received)
- Strip the `$` sign and parse as float

**Example rows**:
```
Date,Date Processed,Description,Amount,...,Additional Information
16 Dec. 2025,16 Dec. 2025,AMZN MKTP CA*242YF34K3  866-216-1072,$23.49,...,AMZN MKTP CA*242YF34K3  866-216-1072
29 Nov. 2025,29 Nov. 2025,-$673.37,...,PAYMENT RECEIVED - THANK YOU
```

---

## Keyword Matching Logic

### Matching Rules
1. **Case-insensitive matching**
2. **Partial string matching**: If keyword is found anywhere in the target string, it's a match
3. **Target strings**:
   - CIBC: Column B (Name/Details)
   - AMEX: Column J (Additional Information)

### Conflict Detection
If a transaction matches keywords from **multiple categories**, flag it as a **conflict** and require user resolution.

### Example
- Category "Shopping" has keyword: `AMZN MKTP`
- Transaction has Additional Info: `AMZN MKTP CA*242YF34K3 866-216-1072`
- Result: **MATCH** (keyword found within string)

---

## User Flow

### Step 1: Upload Bank Documents
- User uploads one or more CSV/Excel files
- App detects bank type from filename:
  - Starts with "cibc" → CIBC format
  - Starts with "Summary" → AMEX format
- Parse files according to their respective formats
- Combine all transactions into a unified internal format

### Step 2: Process & Categorize
- Run all transactions through keyword matching
- Sort into three buckets:
  1. **Categorized**: Matched exactly one category
  2. **Conflicts**: Matched multiple categories
  3. **Unassigned**: Matched no categories

### Step 3: Resolve Issues
- If there are **conflicts**: Show list of conflicting transactions, let user pick which category each belongs to
- If there are **unassigned** transactions: Show list and prompt user to add keywords to existing categories (or create new categories)
- After adding keywords, user clicks "Reprocess" to run matching again

### Step 4: View Results
- Only accessible when conflicts = 0 AND unassigned = 0
- Show list of all categories with:
  - Category name
  - Net total (money in - money out)
  - Itemized list of transactions below

---

## Date Filtering

### Filter Options (Dropdown)
- **All** (default)
- **Specific Year**: e.g., 2024, 2025
- **Specific Month**: e.g., January 2025, February 2025

### Behavior
- Filter applies to the results view
- Totals recalculate based on filtered date range
- Dynamically populate year/month options based on transactions in the dataset

---

## Category Management

### Operations
- **Create**: Add new category with name and initial keywords
- **Edit**: Modify category name or keywords
- **Delete**: Remove category (transactions become unassigned)
- **Add Keyword**: Quick action from unassigned list

### UI for Keywords
- Display as tags/chips
- Allow adding multiple keywords at once (comma-separated or one at a time)
- Keywords are trimmed of whitespace

---

## Internal Data Model

### Unified Transaction Format
```typescript
interface Transaction {
  id: string;                    // Generated UUID
  date: Date;
  description: string;           // Original description text
  matchField: string;            // The field used for keyword matching
  amountOut: number;             // Money leaving account (positive)
  amountIn: number;              // Money entering account (positive)
  netAmount: number;             // amountIn - amountOut
  source: 'CIBC' | 'AMEX';
  categoryId: string | null;     // null if unassigned
  isConflict: boolean;           // true if matched multiple categories
  conflictingCategories?: string[]; // Category IDs if conflict
}
```

### Category Format
```typescript
interface Category {
  id: string;
  name: string;
  keywords: string[];
}
```

---

## UI Components

### 1. File Upload Area
- Drag & drop zone or file picker
- Accept `.csv`, `.xlsx`, `.xls`
- Show list of uploaded files with bank type detected

### 2. Category Manager
- List of all categories with keyword counts
- Add/Edit/Delete buttons
- Inline keyword editing (tag-style)

### 3. Processing Status
- Progress indicator during parsing
- Summary: "X categorized, Y conflicts, Z unassigned"

### 4. Conflict Resolution View
- Table of conflicting transactions
- Show: Date, Description, Amount, Matching Categories
- Dropdown or buttons to pick correct category

### 5. Unassigned Transactions View
- Table of unassigned transactions  
- Show: Date, Description, Amount
- "Add keyword to category" action per transaction
- Bulk actions if feasible

### 6. Results View
- Date filter dropdown at top
- Accordion or card for each category:
  - Header: Category Name | Net Total
  - Expandable: Itemized transaction list
- Each transaction shows: Date, Description, Amount (formatted)

---

## Security Considerations

1. **No server-side processing**: All file parsing and categorization happens in the browser
2. **No external API calls** with transaction data
3. **No localStorage/sessionStorage**: Transaction data lives only in React state
4. **Categories file is gitignored**: User's financial keywords never committed to repo
5. **Clear data on refresh**: No traces left in browser

---

## File Structure Suggestion

```
/app
  /page.tsx                 # Main app entry
  /components
    /FileUpload.tsx
    /CategoryManager.tsx
    /ConflictResolver.tsx
    /UnassignedList.tsx
    /ResultsView.tsx
    /DateFilter.tsx
  /lib
    /parsers
      /cibc.ts              # CIBC file parser
      /amex.ts              # AMEX file parser
    /categorizer.ts         # Keyword matching logic
    /types.ts               # TypeScript interfaces
    /categoryStore.ts       # Read/write categories.json
/data
  /categories.json          # User's categories (gitignored)
/.gitignore                 # Include /data/categories.json
```

---

## Edge Cases to Handle

1. **Empty files**: Show error, don't crash
2. **Wrong file format**: Validate headers/structure, show helpful error
3. **Duplicate transactions**: Consider deduplication by date + description + amount
4. **Empty categories**: Allow categories with no keywords (won't match anything)
5. **Special characters in keywords**: Handle regex-unsafe characters
6. **Large files**: Consider chunked processing for files with 10k+ rows
7. **Mixed file uploads**: Handle uploading CIBC and AMEX files together

---

## Nice-to-Haves (Future Enhancements)

- Export results to CSV/PDF
- Import/export categories backup
- Transaction search
- Manual category override per transaction
- Split transaction across categories
- Running balance view

---

## Development Notes

- Use `papaparse` for CSV parsing (handles edge cases well)
- Use `xlsx` (SheetJS) for Excel parsing
- Generate UUIDs with `crypto.randomUUID()` 
- Format currency with `Intl.NumberFormat`
- Parse dates carefully — CIBC uses `MM/DD/YYYY`, AMEX uses `DD Mon. YYYY`