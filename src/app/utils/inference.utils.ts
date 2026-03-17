import { NormalizedKind } from '../models/form.models';

const keywordRules: Array<{ pattern: RegExp; kind: NormalizedKind }> = [
  { pattern: /(email|mail|courriel)/i, kind: 'email' },
  { pattern: /(phone|telephone|tel|mobile|portable)/i, kind: 'phone' },
  { pattern: /(url|website|site|lien)/i, kind: 'url' },
  { pattern: /(description|note|commentaire|observation|detail|message|remarque|texte)/i, kind: 'textarea' },
  { pattern: /(date|naissance|birth|expir|creation|debut|fin|deadline)/i, kind: 'date' },
  { pattern: /(montant|amount|prix|price|cout|cost|quantite|qty|nombre|count|age|score|taux|rate|poids|weight)/i, kind: 'number' },
  { pattern: /(oui|non|yes|no|active|enabled|checkbox|valid|approuv)/i, kind: 'checkbox' },
];

export function sanitizeKey(input: string): string {
  const key = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return key || 'field';
}

export function inferKindFromLabel(label: string): NormalizedKind {
  for (const rule of keywordRules) {
    if (rule.pattern.test(label)) {
      return rule.kind;
    }
  }
  return 'text';
}

export function convertExcelFormulaToFormio(expr: string): string {
  let out = expr.startsWith('=') ? expr.slice(1) : expr;
  const fnMap: Record<string, string> = {
    'IF(': '(',
    'SUM(': 'sum(',
    'AVERAGE(': 'average(',
    'ROUND(': 'Math.round(',
    'ABS(': 'Math.abs(',
    'MAX(': 'Math.max(',
    'MIN(': 'Math.min(',
    'CONCATENATE(': 'concat(',
    'LEN(': 'length(',
    'LOWER(': 'toLowerCase(',
    'UPPER(': 'toUpperCase(',
  };
  for (const [excelFn, jsFn] of Object.entries(fnMap)) {
    out = out.replace(new RegExp(excelFn, 'gi'), jsFn);
  }
  out = out
    .replace(/<>/g, '!=')
    .replace(/\bAND\b/gi, '&&')
    .replace(/\bOR\b/gi, '||')
    .replace(/\bNOT\b/gi, '!')
    .replace(/\bTRUE\b/gi, 'true')
    .replace(/\bFALSE\b/gi, 'false')
    .replace(/\b([A-Z]+\d+)\b/g, (_, ref: string) => `data.${ref.toLowerCase()}`);
  return `value = ${out}`;
}

export function groupPdfItemsToLines(
  items: Array<{ text: string; x: number; y: number }>,
  yThreshold = 3,
): string[] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: Array<Array<{ text: string; x: number; y: number }>> = [];

  for (const item of sorted) {
    const existingLine = lines.find((line) => Math.abs(line[0].y - item.y) <= yThreshold);
    if (existingLine) {
      existingLine.push(item);
    } else {
      lines.push([item]);
    }
  }

  return lines
    .map((line) => line.sort((a, b) => a.x - b.x).map((token) => token.text).join(' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}
