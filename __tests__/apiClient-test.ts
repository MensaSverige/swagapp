jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

import MockAdapter from 'axios-mock-adapter';
import apiClient from '../apiClient';
import Keychain from 'react-native-keychain';
import useStore from '../store/store';

describe('apiClient', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    const getGenericPasswordMock = Keychain.getGenericPassword as jest.Mock;
    getGenericPasswordMock.mockResolvedValue({
      password: 'test-access-token',
    });

    const setGenericPasswordMock = Keychain.setGenericPassword as jest.Mock;
    setGenericPasswordMock.mockResolvedValue(null);

    // Put a user in the store
    const mockUser = {username: 'testuser', name: 'Test User'};

    // Set the user in the store
    useStore.getState().setUser(mockUser);
  });

  afterEach(() => {
    mock.restore();
    jest.restoreAllMocks();
    // Clear the user from the store
    useStore.getState().setUser(null);
  });

  it('should add Authorization header for a successful request', async () => {
    mock.onGet('/test').reply(200, {data: 'response'});

    const response = await apiClient.get('/test');

    expect(response.config.headers.Authorization).toBe(
      'Bearer test-access-token',
    );
    expect(response.data.data).toBe('response');
  });

  it('should make a successful request with a valid access token', async () => {
    // Mock Keychain to return a valid access token
    const getGenericPasswordMock = Keychain.getGenericPassword as jest.Mock;
    getGenericPasswordMock.mockResolvedValue({password: 'valid-access-token'});

    // Mock a successful response for a test endpoint
    mock.onGet('/test-success').reply(200, {message: 'Success'});

    // Make a request to the test endpoint
    const response = await apiClient.get('/test-success');

    // Assertions
    expect(response.config.headers.Authorization).toBe(
      'Bearer valid-access-token',
    );
    expect(response.status).toBe(200);
    expect(response.data.message).toBe('Success');
  });

  it('should refresh the access token when expired and retry the request', async () => {
    // Set up the sequence for Keychain.getGenericPassword mocks
    const getGenericPasswordMock = Keychain.getGenericPassword as jest.Mock;
    getGenericPasswordMock
      .mockResolvedValueOnce({password: 'expired-access-token'}) // First call (for access token)
      .mockResolvedValueOnce({password: 'valid-refresh-token'}); // Second call (for refresh token)

    // Mock a 401 response for an expired access token, then a successful response
    mock
      .onGet('/test-refresh')
      .replyOnce(401)
      .onGet('/test-refresh')
      .reply(200, {message: 'Refreshed Success'});

    // Mock a successful response for the refresh token endpoint
    mock
      .onPost('/refresh_token')
      .reply(200, {access_token: 'new-access-token'});

    // Make a request to the test endpoint
    const response = await apiClient.get('/test-refresh');

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data.message).toBe('Refreshed Success');
    expect(getGenericPasswordMock).toHaveBeenNthCalledWith(2, {
      service: 'refreshToken',
    }); // Check if refresh token was requested
  });

  it('should re-login using stored credentials when both access and refresh tokens are expired', async () => {
    // Set up the sequence for Keychain.getGenericPassword mocks
    const getGenericPasswordMock = Keychain.getGenericPassword as jest.Mock;
    getGenericPasswordMock
      .mockResolvedValueOnce({password: 'expired-access-token'}) // First call (for access token)
      .mockResolvedValueOnce(null) // Second call (for refresh token, simulating expiration)
      .mockResolvedValueOnce({username: 'user', password: 'password'}); // Third call (for credentials)

    // Mock a 401 response for an expired access token, then a successful response
    mock
      .onGet('/test-relogin')
      .replyOnce(401)
      .onGet('/test-relogin')
      .reply(200, {message: 'Relogin Success'});

    // Mock failure for the refresh token endpoint
    mock.onPost('/refresh_token').reply(401);

    // Mock a successful response for the login endpoint
    mock.onPost('/auth').reply(200, {access_token: 'new-access-token'});

    // Make a request to the test endpoint
    const response = await apiClient.get('/test-relogin');

    // Assertions
    expect(response.status).toBe(200);
    expect(response.data.message).toBe('Relogin Success');
    expect(getGenericPasswordMock).toHaveBeenNthCalledWith(3, {
      service: 'credentials',
    }); // Check if credentials were requested
  });

  it('should remove user and clear credentials when re-login fails', async () => {
    // Set up the sequence for Keychain.getGenericPassword mocks
    const getGenericPasswordMock = Keychain.getGenericPassword as jest.Mock;
    getGenericPasswordMock
      .mockResolvedValueOnce({password: 'expired-access-token'}) // First call (for access token)
      .mockResolvedValueOnce(null) // Second call (for refresh token, simulating expiration)
      .mockResolvedValueOnce({username: 'user', password: 'invalid-password'}); // Third call (for credentials)

    // Mock a 401 response for an expired access token
    mock.onGet('/test-relogin-fail').reply(401);

    // Mock failure for the refresh token endpoint
    mock.onPost('/refresh_token').reply(401);

    // Mock a failed response for the login endpoint
    mock.onPost('/auth').reply(401);

    // Mock Keychain.resetGenericPassword
    const resetGenericPasswordMock = Keychain.resetGenericPassword as jest.Mock;
    resetGenericPasswordMock.mockResolvedValue(null);

    // Make a request to the test endpoint
    await expect(apiClient.get('/test-relogin-fail')).rejects.toEqual(
      'Login failed',
    );

    // Assertions
    expect(resetGenericPasswordMock).toHaveBeenCalledTimes(3); // Check if credentials were cleared
    const store = useStore.getState();
    expect(store.user).toBeNull(); // Check if user object was removed
  });
});
