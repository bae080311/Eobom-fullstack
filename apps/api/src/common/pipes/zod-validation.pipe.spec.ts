import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe.js';

const schema = z.object({ name: z.string().min(1), age: z.number() });
const pipe = new ZodValidationPipe(schema);

describe('ZodValidationPipe', () => {
  it('passes valid data through', () => {
    expect(pipe.transform({ name: 'Alice', age: 30 })).toEqual({ name: 'Alice', age: 30 });
  });

  it('strips extra properties', () => {
    const result = pipe.transform({ name: 'Alice', age: 30, extra: true });
    expect(result).toEqual({ name: 'Alice', age: 30 });
    expect(result).not.toHaveProperty('extra');
  });

  it('throws BadRequestException on validation failure', () => {
    expect(() => pipe.transform({ name: '', age: 'oops' })).toThrow(BadRequestException);
  });

  it('throws BadRequestException for missing required fields', () => {
    expect(() => pipe.transform({})).toThrow(BadRequestException);
  });

  it('works with nested schemas', () => {
    const nested = new ZodValidationPipe(z.object({ user: z.object({ id: z.string() }) }));
    expect(nested.transform({ user: { id: 'abc' } })).toEqual({ user: { id: 'abc' } });
  });
});
