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

// Mock zustand/react/shallow
vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: any) => fn,
}));

// Mock CSS.supports
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'CSS', {
    value: {
      supports: () => true,
    },
    writable: true,
  });
}

if (typeof global !== 'undefined') {
  Object.defineProperty(global, 'CSS', {
    value: {
      supports: () => true,
    },
    writable: true,
  });
}

// Mock matchMedia
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
