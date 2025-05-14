// Controller/ProcessedController/__tests__/SyncTurbineDataController.test.js
import { jest } from '@jest/globals';

// ✅ Step 1: Mock the module using unstable_mockModule
const mockRun = jest.fn();
const mockAll = jest.fn();

jest.unstable_mockModule('../../../Database/Database.js', () => ({
  Predictions_DataDbInstance: {
    run: mockRun,
    all: mockAll
  },
  // 👇 Export all the other names too to avoid the "missing export" error
  processedDbInstance: null,
  unprocessedDbInstance: null,
  InitializeDatabases: jest.fn(),
  startDatabases: jest.fn()
}));

// ✅ Step 2: Now import everything AFTER the mock
const { syncTurbineData } = await import('../SyncTurbineDataController.js');
const { Predictions_DataDbInstance } = await import('../../../Database/Database.js');

// ✅ Step 3: Mock response helper
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn();
  return res;
};

describe('syncTurbineData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 200 with message when no turbine locations exist', async () => {
    const req = {};
    const res = mockResponse();

    Predictions_DataDbInstance.all.mockResolvedValue([]);

    await syncTurbineData(req, res);

    expect(Predictions_DataDbInstance.all).toHaveBeenCalledWith(
      expect.stringContaining('SELECT DISTINCT FunctionalLoc FROM TurbineData')
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'No turbine locations found to sync.'
    });
  });

  test('successfully syncs turbine locations to Location table', async () => {
    const req = {};
    const res = mockResponse();

    Predictions_DataDbInstance.all.mockResolvedValue([
      { FunctionalLoc: 'LOC001' },
      { FunctionalLoc: 'LOC002' }
    ]);

    Predictions_DataDbInstance.run.mockResolvedValue();

    await syncTurbineData(req, res);

    expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith(expect.stringContaining('INSERT OR IGNORE INTO Location'), ['LOC001']);
    expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith(expect.stringContaining('INSERT OR IGNORE INTO Location'), ['LOC002']);
    expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith('COMMIT');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: ' Location table synced successfully with FunctionalLoc values'
    });
  });

  test('rolls back and returns 500 on database error', async () => {
    const req = {};
    const res = mockResponse();

    Predictions_DataDbInstance.all.mockResolvedValue([
      { FunctionalLoc: 'LOC001' }
    ]);

    Predictions_DataDbInstance.run
      .mockResolvedValueOnce() // BEGIN
      .mockRejectedValueOnce(new Error('Insert failed')) // INSERT
      .mockResolvedValueOnce(); // ROLLBACK

    await syncTurbineData(req, res);

    expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith('ROLLBACK');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to sync turbine locations',
      error: 'Insert failed'
    });
  });
});
