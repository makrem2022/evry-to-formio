import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import {
  ConversionResult,
  ConversionSettings,
  SourceType,
} from './models/form.models';
import { DocxParserService } from './services/docx-parser.service';
import { ExcelParserService } from './services/excel-parser.service';
import { ExportService } from './services/export.service';
import { FileRouterService } from './services/file-router.service';
import { FormioBuilderService } from './services/formio-builder.service';
import { InferenceEngineService } from './services/inference-engine.service';
import { PdfParserService } from './services/pdf-parser.service';
import { ValidationService } from './services/validation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly settings = signal<ConversionSettings>({
    useDataValidation: true,
    useFormulas: true,
    detectRequiredFromStyle: true,
    useOcrFallback: false,
    wizardForMultiSheet: true,
  });
  readonly selectedTab = signal<'summary' | 'tree' | 'json' | 'raw'>('summary');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<ConversionResult | null>(null);

  constructor(
    private readonly fileRouter: FileRouterService,
    private readonly excelParser: ExcelParserService,
    private readonly docxParser: DocxParserService,
    private readonly pdfParser: PdfParserService,
    private readonly inference: InferenceEngineService,
    private readonly formioBuilder: FormioBuilderService,
    private readonly validation: ValidationService,
    private readonly exporter: ExportService,
  ) {}

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.error.set(null);
    this.busy.set(true);

    try {
      const type = this.fileRouter.detectFileType(file);
      if (!type) throw new Error('Unsupported file type.');
      const output = await this.convert(type, file);
      this.result.set(output);
      this.selectedTab.set('summary');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.busy.set(false);
    }
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    await this.onFileSelected({ target: { files: [file] } } as unknown as Event);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  setFlag(key: keyof ConversionSettings, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.settings.update((current) => ({ ...current, [key]: checked }));
  }

  copyJson(): void {
    const value = this.result()?.formio;
    if (!value) return;
    navigator.clipboard.writeText(JSON.stringify(value, null, 2));
  }

  downloadJson(): void {
    const value = this.result()?.formio;
    if (!value) return;
    this.exporter.downloadJson(value, `${value.title || 'form'}.formio.json`);
  }

  private async convert(type: SourceType, file: File): Promise<ConversionResult> {
    const settings = this.settings();
    let extracted: unknown;
    let normalized;

    if (type === 'xls' || type === 'xlsx') {
      extracted = await this.excelParser.parse(file);
      normalized = this.inference.fromExcel(extracted, settings);
    } else if (type === 'docx') {
      extracted = await this.docxParser.parse(file);
      normalized = this.inference.fromDocx(extracted);
    } else {
      extracted = await this.pdfParser.parse(file, settings.useOcrFallback);
      normalized = this.inference.fromPdf(extracted);
    }

    const formio = this.formioBuilder.build(normalized, settings.wizardForMultiSheet);
    const warnings = [
      ...normalized.warnings,
      ...this.validation.validateNormalized(normalized),
      ...this.validation.validateFormio(formio),
    ];

    const sectionsCount = normalized.sections.length;
    const fieldCount = normalized.sections.reduce((sum, section) => sum + section.fields.length, 0);
    const stats = {
      generatedComponents: fieldCount + sectionsCount + 1,
      validations: normalized.sections.flatMap((section) => section.fields).filter((field) => field.min !== undefined || field.max !== undefined || field.maxLength !== undefined || field.options?.length).length,
      formulas: normalized.sections.flatMap((section) => section.fields).filter((field) => !!field.formula).length,
      requiredFields: normalized.sections.flatMap((section) => section.fields).filter((field) => field.required).length,
    };

    return { normalized, formio, extracted, warnings, stats };
  }
}
