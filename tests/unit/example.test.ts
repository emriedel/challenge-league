import { describe, it, expect } from 'vitest';

/**
 * Example unit test to verify Vitest setup
 */
describe('Setup Verification', () => {
  it('should run basic unit tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
});