import '@testing-library/jest-dom';
import { beforeAll, vi } from 'vitest';

// Mock environment variables
beforeAll(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.MAILGUN_SIGNING_KEY = 'test-signing-key';
  process.env.SMTP_HOST = 'smtp.test.com';
  process.env.SMTP_USER = 'test@test.com';
  process.env.SMTP_PASSWORD = 'test-password';
});

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

// Mock Drizzle database
vi.mock('@/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(() => 
        Promise.resolve({
          session: {
            userId: 'test-user-id',
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              name: 'Test User',
            },
          },
        })
      ),
    },
  },
}));