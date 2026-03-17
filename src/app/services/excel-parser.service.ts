import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { ParsedExcelModel, ParsedExcelSheet } from '../models/form.models';

@Injectable({ providedIn: 'root' })
export class ExcelParserService {
  async parse(file: File): Promise<ParsedExcelModel> {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', cellStyles: true, cellFormula: true, cellNF: true });

    const sheets: ParsedExcelSheet[] = workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Array<string | number | boolean | null>>(sheet, {
        header: 1,
        defval: null,
        blankrows: false,
      });

      const headerRow = (rows[0] ?? []).map((v) => String(v ?? '').trim());
      const boldHeaderIndexes = headerRow
        .map((_, index) => {
          const addr = XLSX.utils.encode_cell({ r: 0, c: index });
          const cell = sheet[addr] as XLSX.CellObject & { s?: { font?: { bold?: boolean } } };
          return cell?.s?.font?.bold ? index : -1;
        })
        .filter((i) => i >= 0);

      const formulas: Record<string, string> = {};
      const validations: Record<string, { type: string; operator?: string; values?: unknown[] }> = {};
      Object.keys(sheet)
        .filter((key) => /^[A-Z]+\d+$/.test(key))
        .forEach((addr) => {
          const cell = sheet[addr] as XLSX.CellObject & { f?: string; dv?: { type: string; operator?: string; formula1?: unknown; formula2?: unknown } };
          if (cell?.f) formulas[addr.toLowerCase()] = cell.f;
          if (cell?.dv?.type) {
            validations[addr.toLowerCase()] = {
              type: cell.dv.type,
              operator: cell.dv.operator,
              values: [cell.dv.formula1, cell.dv.formula2],
            };
          }
        });

      return {
        name: sheetName,
        headers: headerRow,
        rows: rows.slice(1),
        formulas,
        validations,
        boldHeaderIndexes,
      };
    });

    const sourceType = file.name.toLowerCase().endsWith('.xls') ? 'xls' : 'xlsx';
    return { sourceType, fileName: file.name, sheets };
  }
}
