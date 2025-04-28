import http from 'http';
import { jest } from '@jest/globals';

// Use ESM-safe mocking
const listenMock = jest.fn((port, callback) => callback());
const createServerMock = jest.fn(() => ({ listen: listenMock }));
http.createServer = createServerMock;

// Dynamically mock `startDatabases` from Database module
const startDatabasesMock = jest.fn();

// Mock the modules using unstable_mockModule
jest.unstable_mockModule('../Database/Database.js', () => ({
  startDatabases: startDatabasesMock
}));

// Mock Express app
const appMock = {
  get: jest.fn()
};
jest.unstable_mockModule('../Config/app.js', () => ({
  default: appMock
}));

describe('StartServer', () => {
  beforeEach(() => {
    process.env.PORT = '3001';
    listenMock.mockClear();
    appMock.get.mockClear();
    startDatabasesMock.mockReset();
  });

  test('starts the server and initializes the DB', async () => {
    startDatabasesMock.mockResolvedValueOnce();

    const { default: startServer } = await import('../StartServer.js');
    await startServer();

    expect(startDatabasesMock).toHaveBeenCalled();
    expect(http.createServer).toHaveBeenCalledWith(appMock);
    expect(listenMock).toHaveBeenCalledWith('3001', expect.any(Function));
    expect(appMock.get).toHaveBeenCalledWith('/health', expect.any(Function));
  });

  test('handles db failure gracefully', async () => {
    const error = new Error('DB Error');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    startDatabasesMock.mockRejectedValueOnce(error);

    const { default: startServer } = await import('../StartServer.js');
    await startServer();

    expect(consoleSpy).toHaveBeenCalledWith('Error starting databases:', 'DB Error');
    consoleSpy.mockRestore();
  });
});
