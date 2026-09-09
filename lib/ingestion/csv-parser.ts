/**
 * @file lib/ingestion/csv-parser.ts
 * @description Native lightweight CSV parser for tabular CampusOS discovery feeds.
 * @purpose Parses flat CSV files with quote escaping and array column delimiters (| or ;) into typed JavaScript objects.
 */

export interface CsvParseOptions {
  delimiter?: string;
  arrayDelimiter?: string;
  arrayColumns?: string[];
  numericColumns?: string[];
  booleanColumns?: string[];
}

export class CsvCatalogParser {
  /**
   * Parses CSV string into an array of objects based on header row.
   */
  static parseCsv<T = Record<string, unknown>>(
    csvContent: string,
    options: CsvParseOptions = {}
  ): T[] {
    const delimiter = options.delimiter || ",";
    const arrayDelimiter = options.arrayDelimiter || "|";
    const arrayCols = new Set(options.arrayColumns || ["tags", "documentsRequired", "batch"]);
    const numericCols = new Set(options.numericColumns || ["scholarshipId", "opportunityId", "annualValue", "minCGPA"]);
    const boolCols = new Set(options.booleanColumns || ["isPaid", "isUrgent", "teammatesNeeded"]);

    const lines = this.splitCsvLines(csvContent);
    if (lines.length < 2) return [];

    const headers = this.parseCsvRow(lines[0], delimiter).map((h) => h.trim());
    const results: T[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cells = this.parseCsvRow(line, delimiter);
      const rowObj: Record<string, unknown> = {};

      headers.forEach((header, colIdx) => {
        const rawVal = cells[colIdx] !== undefined ? cells[colIdx].trim() : "";

        if (arrayCols.has(header)) {
          rowObj[header] = rawVal
            ? rawVal.split(arrayDelimiter).map((s) => s.trim()).filter(Boolean)
            : [];
        } else if (numericCols.has(header)) {
          const num = Number(rawVal);
          rowObj[header] = !isNaN(num) ? num : 0;
        } else if (boolCols.has(header)) {
          rowObj[header] = rawVal.toLowerCase() === "true" || rawVal === "1";
        } else {
          rowObj[header] = rawVal === "" ? null : rawVal;
        }
      });

      results.push(rowObj as T);
    }

    return results;
  }

  /**
   * Splits CSV text taking quoted multiline cells into account.
   */
  private static splitCsvLines(text: string): string[] {
    const lines: string[] = [];
    let currentLine = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        currentLine += char;
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && text[i + 1] === "\n") {
          i++;
        }
        lines.push(currentLine);
        currentLine = "";
      } else {
        currentLine += char;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Parses single CSV row handling escaped quotes.
   */
  private static parseCsvRow(rowText: string, delimiter: string): string[] {
    const cells: string[] = [];
    let currentCell = "";
    let inQuotes = false;

    for (let i = 0; i < rowText.length; i++) {
      const char = rowText[i];
      if (char === '"') {
        if (inQuotes && rowText[i + 1] === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        cells.push(currentCell);
        currentCell = "";
      } else {
        currentCell += char;
      }
    }

    cells.push(currentCell);
    return cells;
  }
}
