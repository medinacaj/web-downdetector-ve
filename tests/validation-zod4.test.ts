import {describe,expect,it} from 'vitest';
import {createReportSchema} from '../src/lib/validation/reports';

const valid={
  serviceSlug:'movistar',
  issueTypeSlug:'lentitud',
  stateCode:'VE-M',
  deviceSeed:'synthetic-device-id-12345'
};

describe('Zod 4.6.7 API contract for POST /api/reports',()=>{
  it('accepts a valid synthetic report without changing its values',()=>{
    const result=createReportSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if(result.success) expect(result.data).toEqual(valid);
  });

  it('rejects arrays and objects for scalar identifiers',()=>{
    expect(createReportSchema.safeParse({...valid,serviceSlug:['movistar']}).success).toBe(false);
    expect(createReportSchema.safeParse({...valid,deviceSeed:{toString:'fake'}}).success).toBe(false);
  });

  it('preserves strict length and state-format validation',()=>{
    expect(createReportSchema.safeParse({...valid,serviceSlug:'x'.repeat(97)}).success).toBe(false);
    expect(createReportSchema.safeParse({...valid,comment:'x'.repeat(281)}).success).toBe(false);
    expect(createReportSchema.safeParse({...valid,stateCode:'VE-XYZ'}).success).toBe(false);
  });

  it('keeps optional text fields optional and removes unknown input keys',()=>{
    const input={...valid,unknownPrivateValue:'should-not-be-stored'};
    const result=createReportSchema.safeParse(input);
    expect(result.success).toBe(true);
    if(result.success) expect(result.data).not.toHaveProperty('unknownPrivateValue');
  });
});
