import { convertExcelFormulaToFormio, inferKindFromLabel, sanitizeKey, groupPdfItemsToLines } from './inference.utils';

describe('inference utils', () => {
  it('sanitizes keys', () => {
    expect(sanitizeKey('Téléphone Mobile*')).toBe('telephone_mobile');
  });

  it('infers excel header kind', () => {
    expect(inferKindFromLabel('Email Address')).toBe('email');
    expect(inferKindFromLabel('Date de naissance')).toBe('date');
    expect(inferKindFromLabel('Amount total')).toBe('number');
  });

  it('converts formulas', () => {
    expect(convertExcelFormulaToFormio('=ROUND(A1<>B1,0)')).toContain('Math.round(data.a1!=data.b1,0)');
  });

  it('groups pdf lines', () => {
    const lines = groupPdfItemsToLines([
      { text: 'Name:', x: 10, y: 100 },
      { text: 'John', x: 80, y: 100 },
      { text: 'Email:', x: 10, y: 80 },
      { text: 'john@x.com', x: 80, y: 80 },
    ]);
    expect(lines[0]).toContain('Name: John');
    expect(lines[1]).toContain('Email: john@x.com');
  });
});
