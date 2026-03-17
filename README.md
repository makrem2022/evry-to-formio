# evry-to-formio

`evry-to-formio` is a browser-first Angular app that converts `.xls`, `.xlsx`, `.docx`, and `.pdf` files into deterministic Form.io JSON without remote AI services.

## Features
- Drag/drop or pick one input file.
- Local deterministic parsers:
  - Excel via `xlsx`
  - DOCX via `mammoth`
  - PDF via `pdfjs-dist`
  - Optional OCR fallback via `tesseract.js`
- Rule-based inference engine producing a normalized schema.
- Form.io builder output with `panel`, `editgrid`, and supported input components.
- Preview tabs: Summary, Tree, JSON, Raw extracted.
- Copy and download JSON.
- Confidence/warnings and conversion statistics.

## Architecture
- `FileRouterService` detects file source type.
- `ExcelParserService` reads workbook sheets, formulas, validations, and style hints.
- `DocxParserService` extracts paragraphs and table structures.
- `PdfParserService` extracts positioned text and grouped lines; OCR is opt-in.
- `InferenceEngineService` maps parser output to normalized form model.
- `FormioBuilderService` maps normalized schema to Form.io JSON.
- `ValidationService` reports warnings.
- `ExportService` downloads JSON output.

## Deterministic inference highlights
### Excel
- Header keyword inference for email/phone/url/textarea/date/number/checkbox.
- Required when label includes `*` or bold header style (toggle).
- Data-validation mapping for list/number/date/text-length.
- Formula conversion to `calculateValue: 'value = ...'` and disabled fields.
- First sample row used as default value (when not a formula).
- Multi-sheet defaults to wizard display when enabled.

### DOCX
- Heading-like uppercase lines split sections.
- `Label: Value` and `Label:` patterns map to fields.
- Two-column tables map to fields.
- Header + many-row tables map to repeatable sections (`editgrid`).

### PDF
- Uses positional items grouped into lines.
- Detects `Label: Value` pairs and checkbox patterns.
- Warns when usable text layer is missing.

## Start
```bash
npm install
npm start
```

## Build and test
```bash
npm test
npm run build
```

## Limitations
- Heuristics are intentionally deterministic and may miss complex layouts.
- Formula translation supports only a minimal subset of Excel functions/operators.
- OCR fallback is disabled by default because it is CPU-intensive.
