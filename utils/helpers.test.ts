import { describe, it, expect } from 'vitest';
import { parseLocaleNumber, round2, toCurrency } from './helpers';

describe('Helpers de Cálculo', () => {
  it('deve converter string de moeda brasileira para número', () => {
    expect(parseLocaleNumber('1.234,56')).toBe(1234.56);
    expect(parseLocaleNumber('0,50')).toBe(0.5);
    expect(parseLocaleNumber('10')).toBe(10);
  });

  it('deve arredondar para 2 casas decimais corretamente', () => {
    expect(round2(10.555)).toBe(10.56);
    expect(round2(10.554)).toBe(10.55);
  });

  it('deve formatar número para moeda brasileira', () => {
    expect(toCurrency(1234.56)).toBe('1.234,56');
    expect(toCurrency(0.5)).toBe('0,50');
  });
});
