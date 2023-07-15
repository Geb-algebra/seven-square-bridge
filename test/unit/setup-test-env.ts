import { installGlobals } from '@remix-run/node';
import { afterAll, beforeEach } from 'vitest';
import { resetDB } from 'test/utils';

installGlobals();

beforeEach(async () => {
  await resetDB();
});

afterAll(async () => {
  await resetDB();
});
