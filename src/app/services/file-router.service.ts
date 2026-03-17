import { Injectable } from '@angular/core';
import { SourceType } from '../models/form.models';

@Injectable({ providedIn: 'root' })
export class FileRouterService {
  detectFileType(file: File): SourceType | null {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const mime = file.type.toLowerCase();

    if (ext === 'xls' || mime.includes('excel')) return 'xls';
    if (ext === 'xlsx' || mime.includes('spreadsheetml')) return 'xlsx';
    if (ext === 'docx' || mime.includes('wordprocessingml')) return 'docx';
    if (ext === 'pdf' || mime.includes('pdf')) return 'pdf';
    return null;
  }
}
