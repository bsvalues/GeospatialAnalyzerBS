import { describe, test, expect } from '@jest/globals';

describe('basic test suite', () => {
  test('simple test', () => {
    expect(1 + 1).toBe(2);
  });
});