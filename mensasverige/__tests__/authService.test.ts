/**
 * Unit tests for authService.authenticate.
 * Mocks the axios instance so no real HTTP calls are made.
 *
 * @jest-environment node
 */

jest.mock('../features/common/services/secureStorage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  deleteItem: jest.fn(),
}));

// mockPost must live inside the mock factory (jest.mock is hoisted above variable
// declarations, so outer const mockPost would be undefined at factory-eval time).
// We expose it via the module registry with requireMock after import.
jest.mock('axios', () => {
  const post = jest.fn();
  const instance = { post };
  return {
    __esModule: true,
    default: { create: jest.fn(() => instance), ...instance },
    create: jest.fn(() => instance),
    _mockInstance: instance, // backdoor so tests can grab it
  };
});

import axios from 'axios';
import { authenticate } from '../features/common/services/authService';

// Grab the shared mock instance created in the factory above
const axiosMock = (axios as any).__proto__?.constructor?._mockInstance
  ?? (jest.requireMock('axios') as any)._mockInstance;
const mockPost: jest.Mock = axiosMock.post;

const fakeAuthResponse = {
  accessToken: 'acc-tok',
  refreshToken: 'ref-tok',
  accessTokenExpiry: new Date(Date.now() + 3600_000).toISOString(),
  user: { userId: 1, isMember: true },
};

beforeEach(() => {
  mockPost.mockReset();
});

describe('authenticate', () => {
  it('returns AuthResponse on 200 (member login)', async () => {
    mockPost.mockResolvedValueOnce({ data: fakeAuthResponse, status: 200 });

    const result = await authenticate('user@example.com', 'pass', false, true);
    expect(result.accessToken).toBe('acc-tok');
    expect(result.user.userId).toBe(1);
    expect(mockPost).toHaveBeenCalledWith('/authm', expect.any(Object));
  });

  it('uses /authb for non-member login', async () => {
    mockPost.mockResolvedValueOnce({ data: fakeAuthResponse, status: 200 });

    await authenticate('user@example.com', 'pass', false, false);
    expect(mockPost).toHaveBeenCalledWith('/authb', expect.any(Object));
  });

  it('throws Swedish error on 401', async () => {
    const err: any = new Error('Request failed with status code 401');
    err.response = { status: 401 };
    mockPost.mockRejectedValueOnce(err);

    await expect(authenticate('u', 'wrong', false, true))
      .rejects.toThrow('Fel användarnamn eller lösenord.');
  });

  it('throws Swedish error on 400', async () => {
    const err: any = new Error('Request failed with status code 400');
    err.response = { status: 400 };
    mockPost.mockRejectedValueOnce(err);

    await expect(authenticate('u', 'wrong', false, true))
      .rejects.toThrow('Fel användarnamn eller lösenord.');
  });

  it('throws server-unreachable message on network error', async () => {
    const err: any = new Error('Network Error');
    mockPost.mockRejectedValueOnce(err);

    await expect(authenticate('u', 'pass', false, true))
      .rejects.toThrow('Det går inte att nå servern just nu.');
  });

  it('re-throws original error for unexpected 5xx (has error.message)', async () => {
    // authService re-throws errors that have a .message and aren't 401/400/422/network
    const err: any = new Error('Request failed with status code 500');
    err.response = { status: 500 };
    mockPost.mockRejectedValueOnce(err);

    await expect(authenticate('u', 'pass', false, true))
      .rejects.toThrow('Request failed with status code 500');
  });

  it('throws generic message when error has no .message', async () => {
    // Rare: an error object without a message → generic fallback
    mockPost.mockRejectedValueOnce({});

    await expect(authenticate('u', 'pass', false, true))
      .rejects.toThrow('Något gick fel. Försök igen senare.');
  });
});
