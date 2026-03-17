export type SourceType = 'xlsx' | 'xls' | 'docx' | 'pdf';
export type NormalizedKind =
  | 'text'
  | 'email'
  | 'phone'
  | 'url'
  | 'textarea'
  | 'number'
  | 'date'
  | 'checkbox'
  | 'select'
  | 'radio';

export interface NormalizedForm {
  title: string;
  sourceType: SourceType;
  sections: NormalizedSection[];
  warnings: string[];
}

export interface NormalizedSection {
  title: string;
  repeatable: boolean;
  fields: NormalizedField[];
}

export interface NormalizedField {
  label: string;
  key: string;
  kind: NormalizedKind;
  required: boolean;
  options?: Array<{ label: string; value: string }>;
  defaultValue?: string | number | boolean;
  formula?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  disabled?: boolean;
}

export interface ConversionSettings {
  useDataValidation: boolean;
  useFormulas: boolean;
  detectRequiredFromStyle: boolean;
  useOcrFallback: boolean;
  wizardForMultiSheet: boolean;
}

export interface ConversionStats {
  generatedComponents: number;
  validations: number;
  formulas: number;
  requiredFields: number;
}

export interface ConversionResult {
  normalized: NormalizedForm;
  formio: FormioForm;
  extracted: unknown;
  warnings: string[];
  stats: ConversionStats;
}

export interface FormioForm {
  title: string;
  display: 'form' | 'wizard';
  components: FormioComponent[];
}

export interface FormioComponent {
  type: string;
  key: string;
  label?: string;
  input?: boolean;
  components?: FormioComponent[];
  validate?: { required?: boolean };
  data?: { values?: Array<{ label: string; value: string }> };
  calculateValue?: string;
  defaultValue?: string | number | boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  disableOnInvalid?: boolean;
  tree?: boolean;
}

export interface ParsedExcelSheet {
  name: string;
  headers: string[];
  rows: Array<Array<string | number | boolean | null>>;
  formulas: Record<string, string>;
  validations: Record<string, { type: string; operator?: string; values?: unknown[] }>;
  boldHeaderIndexes: number[];
}

export interface ParsedExcelModel {
  sourceType: 'xlsx' | 'xls';
  fileName: string;
  sheets: ParsedExcelSheet[];
}

export interface ParsedDocxModel {
  sourceType: 'docx';
  fileName: string;
  paragraphs: string[];
  tables: string[][][];
}

export interface PdfTextItem {
  text: string;
  x: number;
  y: number;
  page: number;
}

export interface ParsedPdfModel {
  sourceType: 'pdf';
  fileName: string;
  pages: Array<{ pageNumber: number; lines: string[]; items: PdfTextItem[] }>;
  hasUsableTextLayer: boolean;
}
