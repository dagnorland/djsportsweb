import { describe, expect, it } from 'vitest';
import { profileStorageKey, splitProfileKey } from '@/lib/backup/profile-key';

describe('profile storage key', () => {
  it('is the documented SHA-256 (same vector as the Flutter test)', async () => {
    // printf 'djsports:v1:oslo vikings|1234' | shasum -a 256
    expect(await profileStorageKey('Oslo Vikings|1234'))
      .toBe('1a494a588b3e8622b83e9ea5db7d2598e2fc95efed03b55856b7c21bda0cc007');
  });
  it('trims and lower-cases the name, keeps the PIN', async () => {
    expect(await profileStorageKey('  Oslo Vikings |1234')).toBe(await profileStorageKey('oslo vikings|1234'));
    expect(await profileStorageKey('Oslo Vikings|1234')).not.toBe(await profileStorageKey('Oslo Vikings|1235'));
    expect(splitProfileKey('A|B|1234')).toEqual({ name: 'A|B', pin: '1234' });
  });
});
