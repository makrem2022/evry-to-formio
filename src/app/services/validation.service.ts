import { Injectable } from '@angular/core';
import { FormioForm, NormalizedForm } from '../models/form.models';

@Injectable({ providedIn: 'root' })
export class ValidationService {
  validateNormalized(form: NormalizedForm): string[] {
    const warnings: string[] = [];
    if (!form.sections.length) warnings.push('No sections inferred.');
    form.sections.forEach((section) => {
      if (!section.fields.length) warnings.push(`Section "${section.title}" has no fields.`);
      section.fields.forEach((field) => {
        if (!field.key) warnings.push(`Field "${field.label}" has empty key.`);
      });
    });
    return warnings;
  }

  validateFormio(form: FormioForm): string[] {
    const warnings: string[] = [];
    if (!form.components.some((c) => c.type === 'button' && c.key === 'submit')) {
      warnings.push('Submit button missing.');
    }
    return warnings;
  }
}
