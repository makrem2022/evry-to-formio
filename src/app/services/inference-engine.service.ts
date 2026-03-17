import { Injectable } from '@angular/core';
import {
  ConversionSettings,
  NormalizedField,
  NormalizedForm,
  NormalizedSection,
  ParsedDocxModel,
  ParsedExcelModel,
  ParsedPdfModel,
} from '../models/form.models';
import { convertExcelFormulaToFormio, inferKindFromLabel, sanitizeKey } from '../utils/inference.utils';

@Injectable({ providedIn: 'root' })
export class InferenceEngineService {
  fromExcel(model: ParsedExcelModel, settings: ConversionSettings): NormalizedForm {
    const sections: NormalizedSection[] = model.sheets.map((sheet) => {
      const fields: NormalizedField[] = sheet.headers.map((header, colIndex) => {
        const key = sanitizeKey(header);
        const kind = inferKindFromLabel(header);
        const row1 = sheet.rows[0]?.[colIndex] ?? undefined;
        const formula = sheet.formulas[`${String.fromCharCode(97 + colIndex)}2`];
        const validation = sheet.validations[`${String.fromCharCode(97 + colIndex)}2`];
        const required = header.includes('*') || (settings.detectRequiredFromStyle && sheet.boldHeaderIndexes.includes(colIndex));

        const field: NormalizedField = { label: header, key, kind, required };
        if (typeof row1 !== 'object' && row1 !== undefined && formula === undefined) {
          field.defaultValue = row1 as string | number | boolean;
        }
        if (settings.useFormulas && formula) {
          field.formula = convertExcelFormulaToFormio(formula);
          field.disabled = true;
        }

        if (settings.useDataValidation && validation) {
          if (validation.type === 'list') {
            field.kind = 'select';
            const raw = String(validation.values?.[0] ?? '').replace(/^"|"$/g, '');
            field.options = raw.split(',').map((opt) => ({ label: opt.trim(), value: sanitizeKey(opt) }));
          }
          if (validation.type === 'whole' || validation.type === 'decimal') {
            field.kind = 'number';
            if (typeof validation.values?.[0] === 'number') field.min = validation.values[0];
            if (typeof validation.values?.[1] === 'number') field.max = validation.values[1];
          }
          if (validation.type === 'date') field.kind = 'date';
          if (validation.type === 'textLength' && typeof validation.values?.[1] === 'number') field.maxLength = validation.values[1];
        }

        return field;
      });
      return { title: sheet.name, repeatable: false, fields };
    });

    return { title: model.fileName.replace(/\.[^.]+$/, ''), sourceType: model.sourceType, sections, warnings: [] };
  }

  fromDocx(model: ParsedDocxModel): NormalizedForm {
    const sections: NormalizedSection[] = [];
    let current: NormalizedSection = { title: model.fileName.replace(/\.[^.]+$/, ''), repeatable: false, fields: [] };

    model.paragraphs.forEach((line, index) => {
      if (/^[A-Z][\w\s]{2,60}$/.test(line) && line === line.toUpperCase()) {
        if (current.fields.length) sections.push(current);
        current = { title: line, repeatable: false, fields: [] };
        return;
      }
      const pair = line.match(/^([^:]{2,80}):\s*(.+)$/);
      if (pair) {
        current.fields.push({ label: pair[1].trim(), key: sanitizeKey(pair[1]), kind: inferKindFromLabel(pair[1]), required: false, defaultValue: pair[2].trim() });
      } else if (line.endsWith(':')) {
        const next = model.paragraphs[index + 1];
        current.fields.push({ label: line.slice(0, -1), key: sanitizeKey(line), kind: inferKindFromLabel(line), required: false, defaultValue: next && !next.includes(':') ? next : undefined });
      }
    });

    model.tables.forEach((table, idx) => {
      if (table.every((row) => row.length === 2)) {
        table.forEach((row) => {
          current.fields.push({ label: row[0], key: sanitizeKey(row[0]), kind: inferKindFromLabel(row[0]), required: false, defaultValue: row[1] });
        });
      } else if (table.length > 1) {
        const headers = table[0];
        sections.push({
          title: `Table ${idx + 1}`,
          repeatable: true,
          fields: headers.map((h) => ({ label: h, key: sanitizeKey(h), kind: inferKindFromLabel(h), required: false })),
        });
      }
    });

    if (current.fields.length) sections.push(current);
    if (!sections.length) sections.push(current);

    return {
      title: model.fileName.replace(/\.[^.]+$/, ''),
      sourceType: 'docx',
      sections,
      warnings: model.paragraphs.filter((p) => p.length > 200).map((_) => 'Long descriptive paragraph detected; not all prose converted to fields.'),
    };
  }

  fromPdf(model: ParsedPdfModel): NormalizedForm {
    const section: NormalizedSection = { title: 'PDF Extract', repeatable: false, fields: [] };
    model.pages.forEach((page) => {
      page.lines.forEach((line) => {
        const pair = line.match(/^([^:]{2,80}):\s*(.+)$/);
        if (pair) {
          section.fields.push({ label: pair[1], key: sanitizeKey(pair[1]), kind: inferKindFromLabel(pair[1]), required: false, defaultValue: pair[2] });
        } else if (/(\[\s\]|☐|☑|yes\s*\/\s*no)/i.test(line)) {
          section.fields.push({ label: line.replace(/(\[\s\]|☐|☑)/g, '').trim(), key: sanitizeKey(line), kind: 'checkbox', required: false });
        }
      });
    });

    return {
      title: model.fileName.replace(/\.[^.]+$/, ''),
      sourceType: 'pdf',
      sections: [section],
      warnings: model.hasUsableTextLayer ? [] : ['Scanned PDF detected. OCR may be required.'],
    };
  }
}
