/**
 * American Express (AMEX) Bank Parser
 *
 * Parses transaction exports from American Express Canada.
 *
 * File Format:
 * - Excel only (.xlsx)
 * - Rows 1-11: Header/metadata (skipped)
 * - Row 12: Column headers
 * - Row 13+: Transaction data
 * - Column A (0): Date (DD Mon. YYYY format, e.g., "16 Dec. 2025")
 * - Column B (1): Date Processed
 * - Column C (2): Description
 * - Column D (3): Amount (with $ sign, positive = expense, negative = payment)
 * - Column J (9): Additional Information (used for keyword matching)
 */

import type { BankParser, BankDetectionResult, ValidationResult, ParseResult, ParsedTransaction } from "../types";
import { getCellString, parseAmount, parseDateDMonY, isEmptyRow, isExcelFile } from "../utils";

// Date pattern: DD Mon. YYYY (e.g., "16 Dec. 2025")
const AMEX_DATE_PATTERN = /^\d{1,2}\s+[A-Za-z]{3,9}\.?\s+\d{4}$/;

// Number of header rows to skip (data starts at row 13, index 12)
const HEADER_ROWS = 12;

export const amexParser: BankParser = {
  meta: {
    id: "AMEX",
    name: "American Express",
    country: "CA",
    supportedExtensions: [".xlsx"],
    formatDescription: "Excel file with data starting at row 13. Date format: DD Mon. YYYY",
    exportInstructionsUrl: "https://www.americanexpress.com/en-ca/account/login",
  },

  detect(file: File, rows: unknown[][]): BankDetectionResult {
    // AMEX requires Excel format
    if (!isExcelFile(file.name)) {
      return { detected: false, confidence: "none", reason: "AMEX files must be Excel format" };
    }

    // AMEX files have at least 13 rows (12 header + 1 data)
    if (rows.length < 13) {
      return { detected: false, confidence: "none", reason: "File too short for AMEX format" };
    }

    // Check data rows (starting at row 13, index 12)
    const dataRows = rows.slice(HEADER_ROWS);
    if (dataRows.length === 0) {
      return { detected: false, confidence: "none", reason: "No data rows found after row 12" };
    }

    let matchCount = 0;
    let totalRows = 0;

    for (const row of dataRows.slice(0, 10)) {
      if (!row || !Array.isArray(row) || row.length < 4) continue;
      if (isEmptyRow(row)) continue;
      totalRows++;

      const dateStr = getCellString(row, 0);
      const amountStr = getCellString(row, 3) || getCellString(row, 2);

      // Check for AMEX date format (DD Mon. YYYY)
      const hasAmexDate = AMEX_DATE_PATTERN.test(dateStr);

      // Check for $ sign in amounts (AMEX includes currency symbol)
      const hasDollarSign = amountStr.includes("$");

      // AMEX has many columns (~10)
      const hasMoreColumns = row.length > 6;

      if (hasAmexDate && (hasDollarSign || hasMoreColumns)) {
        matchCount++;
      }
    }

    if (totalRows === 0) {
      return { detected: false, confidence: "none", reason: "No valid data rows found" };
    }

    const matchRatio = matchCount / totalRows;

    if (matchRatio >= 0.8) {
      return {
        detected: true,
        confidence: "high",
        reason: "File structure matches AMEX format (date format, column structure, $ amounts)",
      };
    } else if (matchRatio >= 0.5) {
      return {
        detected: true,
        confidence: "medium",
        reason: "File partially matches AMEX format",
      };
    } else if (matchRatio >= 0.2) {
      return {
        detected: true,
        confidence: "low",
        reason: "File may be AMEX format",
      };
    }

    return { detected: false, confidence: "none", reason: "File does not match AMEX format" };
  },

  validate(file: File, rows: unknown[][]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // AMEX requires Excel format
    if (!isExcelFile(file.name)) {
      errors.push("AMEX files must be in Excel format (.xlsx)");
      return { isValid: false, errors, warnings };
    }

    // Need at least 13 rows (12 header + 1 data)
    if (rows.length < 13) {
      errors.push("File doesn't have enough rows. AMEX files should have data starting at row 13.");
      return { isValid: false, errors, warnings };
    }

    const dataRows = rows.slice(HEADER_ROWS);
    if (dataRows.length === 0) {
      errors.push("No transaction data found after row 12");
      return { isValid: false, errors, warnings };
    }

    let validRows = 0;
    let invalidDateRows = 0;
    let missingAmountRows = 0;

    for (let i = 0; i < Math.min(dataRows.length, 10); i++) {
      const row = dataRows[i];
      if (!row || !Array.isArray(row) || row.length < 3) continue;

      validRows++;

      const dateStr = getCellString(row, 0);
      const amountStr = getCellString(row, 3) || getCellString(row, 2);

      if (!AMEX_DATE_PATTERN.test(dateStr)) {
        invalidDateRows++;
      }

      if (!amountStr) {
        missingAmountRows++;
      }
    }

    if (validRows === 0) {
      errors.push("No valid transaction rows found");
      return { isValid: false, errors, warnings };
    }

    if (invalidDateRows > validRows / 2) {
      errors.push("Date format doesn't match AMEX format (expected: DD Mon. YYYY, e.g., '16 Dec. 2025')");
    }

    if (missingAmountRows > validRows / 2) {
      warnings.push("Some rows are missing amount values");
    }

    // Check column count
    const firstDataRow = dataRows.find(r => Array.isArray(r) && r.length > 0);
    if (firstDataRow && firstDataRow.length < 4) {
      errors.push(`Expected at least 4 columns for AMEX, found ${firstDataRow.length}`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  },

  parse(file: File, rows: unknown[][]): ParseResult {
    const transactions: ParsedTransaction[] = [];
    const errors: string[] = [];

    // Skip header rows
    const dataRows = rows.slice(HEADER_ROWS);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = HEADER_ROWS + i + 1; // 1-based row number for user display

      try {
        if (!row || !Array.isArray(row) || row.length === 0) continue;
        if (isEmptyRow(row)) continue;

        const dateStr = getCellString(row, 0);

        // Check if this is a payment row (amount in column C, column D empty)
        const columnD = getCellString(row, 3);
        const isPaymentRow = !columnD;

        let description: string;
        let amountStr: string;
        let matchField: string;

        if (isPaymentRow) {
          // Payment format: Amount (negative) in column C, description in column I
          amountStr = getCellString(row, 2);
          description = getCellString(row, 8);
          matchField = description;
        } else {
          // Regular expense format
          // Use Additional Information (Column J, index 9) for categorization
          const originalDescription = getCellString(row, 2);
          amountStr = getCellString(row, 3);
          const additionalInfo = getCellString(row, 9);
          // Prefer additional info for display, fall back to original description
          description = additionalInfo || originalDescription;
          matchField = description;
        }

        if (!dateStr || !matchField) {
          errors.push(`Row ${rowNum}: Missing date or description`);
          continue;
        }

        const date = parseDateDMonY(dateStr);
        if (!date || isNaN(date.getTime())) {
          errors.push(`Row ${rowNum}: Invalid date format "${dateStr}"`);
          continue;
        }

        // Parse amount (AMEX: positive = expense, negative = payment/refund)
        const amount = parseAmount(amountStr);

        transactions.push({
          date,
          description,
          matchField,
        amountOut: amount > 0 ? amount : 0,
          amountIn: amount < 0 ? Math.abs(amount) : 0,
          netAmount: amount < 0 ? Math.abs(amount) : -amount,
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

export default amexParser;
