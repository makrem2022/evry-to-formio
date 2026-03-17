import { InferenceEngineService } from './inference-engine.service';

describe('InferenceEngineService DOCX tables', () => {
  it('maps two-column table rows to fields', () => {
    const service = new InferenceEngineService();
    const result = service.fromDocx({
      sourceType: 'docx',
      fileName: 'sample.docx',
      paragraphs: [],
      tables: [[['First Name', 'Alice'], ['Email', 'alice@mail.com']]],
    });

    const fields = result.sections[0].fields;
    expect(fields.length).toBe(2);
    expect(fields[0].label).toBe('First Name');
    expect(fields[1].kind).toBe('email');
  });
});
