/**
 * CIBC Bank Parser
 *
 * Parses transaction exports from CIBC (Canadian Imperial Bank of Commerce).
 *
 * File Format:
 * - CSV or Excel (.xlsx, .xls, .csv)
 * - No headers, data starts at row 1
 * - Column A (0): Date (MM/DD/YYYY or YYYY-MM-DD)
 * - Column B (1): Description (used for keyword matching)
 * - Column C (2): Money Out (debit)
 * - Column D (3): Money In (credit)
 */

import type { BankParser, BankDetectionResult, ValidationResult, ParseResult, ParsedTransaction } from "../types";
import { getCellString, parseAmount, parseDateMDY, parseDateISO, isEmptyRow } from "../utils";

// Date pattern matchers
const DATE_PATTERN_MDY = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
const DATE_PATTERN_ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse CIBC date format (MM/DD/YYYY or YYYY-MM-DD)
 */
function parseCIBCDate(dateStr: string): Date | null {
  if (DATE_PATTERN_ISO.test(dateStr)) {
    return parseDateISO(dateStr);
  }
  if (DATE_PATTERN_MDY.test(dateStr)) {
    return parseDateMDY(dateStr);
  }
  return null;
}

export const cibcParser: BankParser = {
  meta: {
    id: "CIBC",
    name: "CIBC",
    country: "CA",
    supportedExtensions: [".csv", ".xlsx", ".xls"],
    formatDescription: "4 columns: Date, Description, Money Out, Money In. No headers.",
    exportInstructionsUrl: "https://www.cibc.com/en/personal-banking/ways-to-bank/ways-to-bank-faq/download-transactions.html",
  },

  detect(file: File, rows: unknown[][]): BankDetectionResult {
    if (rows.length === 0) {
      return { detected: false, confidence: "none", reason: "File is empty" };
    }

    let matchCount = 0;
    let totalRows = 0;

    // CIBC data starts at row 1, check first ~10 rows
    for (const row of rows.slice(0, 10)) {
      if (!row || !Array.isArray(row) || row.length < 4) continue;
      if (isEmptyRow(row)) continue;
      totalRows++;

      const dateStr = getCellString(row, 0);
      const description = getCellString(row, 1);
      const moneyOut = getCellString(row, 2);
      const moneyIn = getCellString(row, 3);

      // Check for CIBC date formats
      const hasValidDate = DATE_PATTERN_MDY.test(dateStr) || DATE_PATTERN_ISO.test(dateStr);

      // CIBC doesn't have $ signs in amounts (raw numbers)
      const noDollarSigns = !moneyOut.includes("$") && !moneyIn.includes("$");

      // Should have exactly 4-6 columns and a description
      const hasRightColumnCount = row.length >= 4 && row.length <= 6;
      const hasDescription = description.length > 0;

      if (hasValidDate && noDollarSigns && hasRightColumnCount && hasDescription) {
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
        reason: "File structure matches CIBC format (date format, 4 columns, no currency symbols)",
      };
    } else if (matchRatio >= 0.5) {
      return {
        detected: true,
        confidence: "medium",
        reason: "File partially matches CIBC format",
      };
    } else if (matchRatio >= 0.2) {
      return {
        detected: true,
        confidence: "low",
        reason: "File may be CIBC format",
      };
    }

    return { detected: false, confidence: "none", reason: "File does not match CIBC format" };
  },

  validate(file: File, rows: unknown[][]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (rows.length === 0) {
      errors.push("File is empty");
      return { isValid: false, errors, warnings };
    }

    let validRows = 0;
    let invalidDateRows = 0;
    let missingDescriptionRows = 0;

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row)) continue;

      if (row.length > 0 && row.length < 4) {
        errors.push(`Row ${i + 1} has ${row.length} columns, expected 4 (Date, Description, Money Out, Money In)`);
        continue;
      }

      if (row.length < 4) continue;

      validRows++;

      const dateStr = getCellString(row, 0);
      const description = getCellString(row, 1);

      if (!DATE_PATTERN_MDY.test(dateStr) && !DATE_PATTERN_ISO.test(dateStr)) {
        invalidDateRows++;
      }

      if (!description) {
        missingDescriptionRows++;
      }
    }

    if (validRows === 0) {
      errors.push("No valid rows found. CIBC files need 4 columns: Date, Description, Money Out, Money In");
      return { isValid: false, errors, warnings };
    }

    if (invalidDateRows > validRows / 2) {
      errors.push("Date format doesn't match CIBC format (expected: MM/DD/YYYY or YYYY-MM-DD)");
    }

    if (missingDescriptionRows > validRows / 2) {
      warnings.push("Some rows are missing descriptions");
    }

    return { isValid: errors.length === 0, errors, warnings };
  },

  parse(file: File, rows: unknown[][]): ParseResult {
    const transactions: ParsedTransaction[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      try {
        if (!row || !Array.isArray(row) || row.length < 4) continue;
        if (isEmptyRow(row)) continue;

        const dateStr = getCellString(row, 0);
        const description = getCellString(row, 1);
        const moneyOutStr = getCellString(row, 2);
        const moneyInStr = getCellString(row, 3);

        if (!dateStr || !description) {
          errors.push(`Row ${rowNum}: Missing date or description`);
          continue;
        }

        const date = parseCIBCDate(dateStr);
        if (!date || isNaN(date.getTime())) {
          errors.push(`Row ${rowNum}: Invalid date format "${dateStr}"`);
          continue;
        }

        const moneyOut = Math.abs(parseAmount(moneyOutStr));
        const moneyIn = Math.abs(parseAmount(moneyInStr));

        transactions.push({
          date,
          description,
          matchField: description,
          amountOut: moneyOut,
          amountIn: moneyIn,
          netAmount: moneyIn - moneyOut,
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

export default cibcParser;
