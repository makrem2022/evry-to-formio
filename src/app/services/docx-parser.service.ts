import { Injectable } from '@angular/core';
import * as mammoth from 'mammoth';
import { ParsedDocxModel } from '../models/form.models';

@Injectable({ providedIn: 'root' })
export class DocxParserService {
  async parse(file: File): Promise<ParsedDocxModel> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const paragraphs = result.value
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlResult.value, 'text/html');
    const tableEls = Array.from(doc.querySelectorAll('table'));
    const tables = tableEls.map((table) =>
      Array.from(table.querySelectorAll('tr')).map((row) =>
        Array.from(row.querySelectorAll('th,td')).map((cell) => cell.textContent?.trim() ?? ''),
      ),
    );

    return { sourceType: 'docx', fileName: file.name, paragraphs, tables };
  }
}
