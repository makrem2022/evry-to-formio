import { Injectable } from '@angular/core';
import { FormioComponent, FormioForm, NormalizedField, NormalizedForm } from '../models/form.models';

@Injectable({ providedIn: 'root' })
export class FormioBuilderService {
  build(form: NormalizedForm, wizardMode = true): FormioForm {
    const display = form.sections.length > 1 && wizardMode ? 'wizard' : 'form';
    const components = form.sections.map((section, index) => {
      const childComponents = section.fields.map((field) => this.fieldToComponent(field));
      if (section.repeatable) {
        return {
          type: 'editgrid',
          key: `section_${index}`,
          label: section.title,
          input: true,
          tree: true,
          components: childComponents,
        } as FormioComponent;
      }
      return {
        type: 'panel',
        key: `section_${index}`,
        label: section.title,
        input: false,
        components: childComponents,
      } as FormioComponent;
    });

    components.push({ type: 'button', key: 'submit', label: 'Submit', input: true, disableOnInvalid: true });
    return { title: form.title, display, components };
  }

  private fieldToComponent(field: NormalizedField): FormioComponent {
    const map: Record<NormalizedField['kind'], string> = {
      text: 'textfield',
      email: 'email',
      phone: 'phoneNumber',
      url: 'url',
      textarea: 'textarea',
      number: 'number',
      date: 'datetime',
      checkbox: 'checkbox',
      select: 'select',
      radio: 'radio',
    };

    return {
      type: map[field.kind],
      key: field.key,
      label: field.label,
      input: true,
      validate: { required: field.required || undefined },
      data: field.options ? { values: field.options } : undefined,
      calculateValue: field.formula,
      disabled: field.disabled,
      defaultValue: field.defaultValue,
      min: field.min,
      max: field.max,
      maxLength: field.maxLength,
    };
  }
}
