/**
 * Bank Parser Template
 *
 * Copy this file and rename it to your bank's name (e.g., td.ts, rbc.ts).
 * Then implement the BankParser interface below.
 *
 * Steps to add a new bank:
 * 1. Copy this file to lib/parsers/banks/yourbank.ts
 * 2. Update the meta object with your bank's information
 * 3. Implement the detect(), validate(), and parse() methods
 * 4. Export your parser (it will be auto-registered)
 * 5. Test with sample files from your bank
 *
 * Tips:
 * - Use the utility functions in ../utils.ts for common parsing tasks
 * - Test detection with files from other banks to avoid false positives
 * - Document your bank's export format in the comments
 * - Include example date/amount formats in comments
 */

import type { BankParser, BankDetectionResult, ValidationResult, ParseResult, ParsedTransaction } from "../types";
import {
  getCellString,
  parseAmount,
  isEmptyRow,
  // Choose the date parser(s) that match your bank's format:
  // parseDateMDY,    // MM/DD/YYYY
  // parseDateDMY,    // DD/MM/YYYY
  // parseDateISO,    // YYYY-MM-DD
  // parseDateDMonY,  // DD Mon YYYY (e.g., "16 Dec 2025")
  // parseDateMonDY,  // Mon DD, YYYY (e.g., "Dec 16, 2025")
} from "../utils";

/**
 * TODO: Document your bank's file format here
 *
 * File Format:
 * - File type: CSV/Excel
 * - Headers: Yes/No, at row X
 * - Data starts at row: X
 * - Columns:
 *   - Column A: ...
 *   - Column B: ...
 *   etc.
 */

export const templateParser: BankParser = {
  meta: {
    // REQUIRED: Unique identifier (used in database, keep stable)
    id: "TEMPLATE",

    // REQUIRED: Display name shown in UI
    name: "Template Bank",

    // REQUIRED: Country code (ISO 3166-1 alpha-2)
    country: "XX",

    // REQUIRED: What file types can this parser handle?
    supportedExtensions: [".csv", ".xlsx"],

    // REQUIRED: Brief description of the expected format
    formatDescription: "Describe the expected file format here",

    // OPTIONAL: URL with instructions for exporting from this bank
    exportInstructionsUrl: undefined,
  },

  /**
   * Detect if this parser can handle the given file.
   *
   * This is called during file upload to suggest the correct bank type.
   * Return high confidence only if you're very sure this is your bank's format.
   *
   * @param file - The uploaded file (use for filename checks)
   * @param rows - Pre-parsed rows (CSV/Excel already converted to arrays)
   */
  detect(file: File, rows: unknown[][]): BankDetectionResult {
    // Example: Check if file is empty
    if (rows.length === 0) {
      return { detected: false, confidence: "none", reason: "File is empty" };
    }

    // TODO: Implement detection logic
    // Look for patterns unique to your bank:
    // - Specific column headers
    // - Date format patterns
    // - Number of columns
    // - Text patterns (bank name in file, etc.)

    // Example detection logic:
    // let matchCount = 0;
    // let totalRows = 0;
    //
    // for (const row of rows.slice(0, 10)) {
    //   if (!row || !Array.isArray(row) || row.length < 4) continue;
    //   totalRows++;
    //
    //   // Check for your bank's patterns...
    //   if (matchesBankPattern) matchCount++;
    // }
    //
    // const matchRatio = matchCount / totalRows;
    // if (matchRatio >= 0.8) return { detected: true, confidence: "high", reason: "..." };

    // Default: Don't detect as this bank
    return {
      detected: false,
      confidence: "none",
      reason: "File does not match Template Bank format",
    };
  },

  /**
   * Validate that a file matches the expected format.
   *
   * Called before parsing to give users feedback on file issues.
   * Return specific error messages to help users fix problems.
   */
  validate(file: File, rows: unknown[][]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (rows.length === 0) {
      errors.push("File is empty");
      return { isValid: false, errors, warnings };
    }

    // TODO: Add validation checks:
    // - Correct file type?
    // - Expected number of columns?
    // - Date format matches?
    // - Required columns present?

    return { isValid: errors.length === 0, errors, warnings };
  },

  /**
   * Parse transactions from the file.
   *
   * Only called after successful validation.
   * Extract all transactions and convert to the standard format.
   */
  parse(file: File, rows: unknown[][]): ParseResult {
    const transactions: ParsedTransaction[] = [];
    const errors: string[] = [];

    // TODO: Determine where data starts (skip headers if present)
    const dataStartRow = 0; // Adjust based on your bank's format

    for (let i = dataStartRow; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1; // 1-based for user display

      try {
        if (!row || !Array.isArray(row)) continue;
        if (isEmptyRow(row)) continue;

        // TODO: Extract fields from row
        const dateStr = getCellString(row, 0);
        const description = getCellString(row, 1);
        const amountStr = getCellString(row, 2);

        // TODO: Parse date using appropriate parser
        // const date = parseDateMDY(dateStr);
        const date = new Date(); // Replace with actual parsing

        if (!date || isNaN(date.getTime())) {
          errors.push(`Row ${rowNum}: Invalid date "${dateStr}"`);
          continue;
        }

        // TODO: Parse amounts
        const amount = parseAmount(amountStr);

        // TODO: Determine which is income vs expense
        // This depends on how your bank formats the data
        const amountOut = amount < 0 ? Math.abs(amount) : 0;
        const amountIn = amount > 0 ? amount : 0;

        transactions.push({
          date,
          description,
          matchField: description, // Field used for keyword matching
          amountOut,
          amountIn,
          netAmount: amountIn - amountOut,
        });
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    if (transactions.length === 0 && errors.length === 0) {
      errors.push("No valid transactions found in file");
    }

    return { transactions, errors };
  },
};

// IMPORTANT: Export your parser as default
// The registry will auto-import all parsers from this directory
export default templateParser;
