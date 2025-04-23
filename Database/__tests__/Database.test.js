import { jest } from '@jest/globals';

const mockInitializeDatabases = jest.fn().mockResolvedValue(); // now async!
const mockStartDatabases = jest.fn(async () => {
  await mockInitializeDatabases();
});

jest.unstable_mockModule('../Database.js', () => ({
  InitializeDatabases: mockInitializeDatabases,
  startDatabases: mockStartDatabases
}));

describe('Database.js', () => {
  let InitializeDatabases;
  let startDatabases;

  beforeAll(async () => {
    const dbModule = await import('../Database.js');
    InitializeDatabases = dbModule.InitializeDatabases;
    startDatabases = dbModule.startDatabases;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('InitializeDatabases connects to all databases', async () => {
    await expect(InitializeDatabases()).resolves.not.toThrow();
    expect(mockInitializeDatabases).toHaveBeenCalled();
  });

  test('startDatabases calls InitializeDatabases', async () => {
    await expect(startDatabases()).resolves.not.toThrow();
    expect(mockInitializeDatabases).toHaveBeenCalledTimes(1);
  });

  test('Logs error on failure', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // simulate failure
    mockInitializeDatabases.mockRejectedValueOnce('fail');

    try {
      await InitializeDatabases();
    } catch (e) {
      console.error('Error initializing databases:', e);
    }

    expect(console.error).toHaveBeenCalledWith('Error initializing databases:', 'fail');

    errorSpy.mockRestore();
  });
});
