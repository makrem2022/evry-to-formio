import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker, PSM } from 'tesseract.js';
import { ParsedPdfModel, PdfTextItem } from '../models/form.models';
import { groupPdfItemsToLines } from '../utils/inference.utils';

@Injectable({ providedIn: 'root' })
export class PdfParserService {
  async parse(file: File, useOcrFallback: boolean): Promise<ParsedPdfModel> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pages: ParsedPdfModel['pages'] = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const textContent = await page.getTextContent();
      const items: PdfTextItem[] = textContent.items.map((item) => {
        const tx = item as { str: string; transform: number[] };
        return { text: tx.str, x: tx.transform[4], y: tx.transform[5], page: p };
      });
      const lines = groupPdfItemsToLines(items);
      pages.push({ pageNumber: p, items, lines });
    }

    let hasUsableTextLayer = pages.some((page) => page.lines.join('').trim().length > 20);
    if (!hasUsableTextLayer && useOcrFallback) {
      const worker = await createWorker('eng');
      await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
      const ocr = await worker.recognize(file);
      pages.push({
        pageNumber: 0,
        items: [{ text: ocr.data.text, x: 0, y: 0, page: 0 }],
        lines: ocr.data.text.split(/\n+/).filter(Boolean),
      });
      await worker.terminate();
      hasUsableTextLayer = ocr.data.text.trim().length > 20;
    }

    return { sourceType: 'pdf', fileName: file.name, pages, hasUsableTextLayer };
  }
}
