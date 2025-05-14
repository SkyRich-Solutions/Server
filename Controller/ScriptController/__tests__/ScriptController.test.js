import { jest } from '@jest/globals';

// Declare mock function BEFORE mocking the module
const mockSpawn = jest.fn();

jest.unstable_mockModule('child_process', () => ({
  spawn: mockSpawn
}));

let ScriptController;

beforeAll(async () => {
  const module = await import('../ScriptController.js');
  ScriptController = module.ScriptController;
});

describe('ScriptController', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnValue({ json: jest.fn() })
    };
    jest.clearAllMocks();
  });

  test('should respond with success message when script runs and exits', async () => {
    const mockStdout = {
      on: jest.fn((event, callback) => {
        if (event === 'data') callback('Script output');
      })
    };

    const mockProcess = {
      stdout: mockStdout,
      stderr: { on: jest.fn() },
      on: jest.fn((event, callback) => {
        if (event === 'close') callback(0);
      })
    };

    mockSpawn.mockReturnValue(mockProcess);

    await ScriptController(req, res);

    expect(mockSpawn).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith('Data Cleaning Complete ✅');
  });

  test('should handle script execution error', async () => {
    mockSpawn.mockImplementation(() => {
      throw new Error('Spawn failed');
    });

    await ScriptController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status().json).toHaveBeenCalledWith({ error: 'Failed to run Python script' });
  });
});
