// Shared test setup (vite.config.js -> test.setupFiles).
// The system date is frozen in every test, because semester assignment
// reads new Date() (docs/AUDIT.md B12). Only Date is faked, so timers and
// promises keep working normally.
import { afterEach, beforeEach, vi } from 'vitest';
import { FIXED_NOW } from './fixedDate.js';

function freezeDate() {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(FIXED_NOW);
}

// Frozen here too, so modules that read the date while they are imported
// (for example SubjectMenu's semester options) also see the fixed date.
freezeDate();

beforeEach(freezeDate);

afterEach(() => {
  vi.useRealTimers();
});
