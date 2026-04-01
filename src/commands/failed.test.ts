import { describe, expect, test } from 'bun:test';
import { parseFailedPhrase } from './failed.ts';

describe('parseFailedPhrase', () => {
  test('accepts phrase with multi-word challenge', () => {
    expect(
      parseFailedPhrase('Foo a fait échouer le challenge Bar Baz'),
    ).toEqual({
      pseudo: 'Foo',
      challenge: 'Bar Baz',
    });
  });

  test('trims and normalizes NFC', () => {
    const r = parseFailedPhrase('  X  a fait échouer le challenge  Y  ');
    expect(r).toEqual({ pseudo: 'X', challenge: 'Y' });
  });

  test('rejects invalid format', () => {
    expect(parseFailedPhrase('random text')).toBeNull();
    expect(parseFailedPhrase('X a fait échouer le challenge ')).toBeNull();
  });
});
