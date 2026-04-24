import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock react-virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (options: any) => ({
    getVirtualItems: () => Array.from({ length: options.count }).map((_, i) => ({
      index: i,
      start: i * 50,
      size: 50,
      key: i,
    })),
    getTotalSize: () => options.count * 50,
    measureElement: vi.fn(),
    scrollToIndex: vi.fn(),
  }),
}));
