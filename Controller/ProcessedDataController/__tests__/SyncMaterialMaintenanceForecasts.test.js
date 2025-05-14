import { jest } from '@jest/globals';

// Step 1: Setup mock before dynamic imports
const mockRun = jest.fn();

jest.unstable_mockModule('../../../Database/Database.js', () => ({
  Predictions_DataDbInstance: {
    run: mockRun
  }
}));

// Step 2: Define controller to be loaded dynamically
let syncMaterialMaintenanceForecasts;

beforeAll(async () => {
  const controllerModule = await import('../SyncMaterialMaintenanceForecasts.js');
  syncMaterialMaintenanceForecasts = controllerModule.syncMaterialMaintenanceForecasts;
});

beforeEach(() => {
  jest.clearAllMocks();
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn();
  return res;
};

describe('syncMaterialMaintenanceForecasts', () => {
  test('returns 400 if forecasts is not an array', async () => {
    const req = { body: { forecasts: 'invalid' } };
    const res = mockResponse();

    await syncMaterialMaintenanceForecasts(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid payload. Expected 'forecasts' array."
    });
  });

  test('returns 200 for empty forecasts array', async () => {
    const req = { body: { forecasts: [] } };
    const res = mockResponse();

    await syncMaterialMaintenanceForecasts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'No forecasts to sync (empty list).'
    });
  });

  test('successfully syncs forecast rows', async () => {
    const req = {
      body: {
        forecasts: [
          {
            Material_ID: 1,
            Plant_ID: 101,
            LastMaintenance: '2025-04-17T10:00:00Z',
            AverageIntervalDays: 180,
            NextEstimatedMaintenanceDate: '2025-10-14T00:00:00Z'
          }
        ]
      }
    };
    const res = mockResponse();

    mockRun.mockResolvedValue();

    await syncMaterialMaintenanceForecasts(req, res);

    expect(mockRun).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO MaintenanceForecasts'), expect.any(Array));
    expect(mockRun).toHaveBeenCalledWith('COMMIT');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Synced 1 maintenance forecast entries'
    });
  });

  test('skips invalid forecast row (missing Material_ID)', async () => {
    const req = {
      body: {
        forecasts: [
          {
            // Missing Material_ID
            Plant_ID: 101,
            AverageIntervalDays: 180
          }
        ]
      }
    };
    const res = mockResponse();

    mockRun.mockResolvedValue();

    await syncMaterialMaintenanceForecasts(req, res);

    expect(mockRun).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockRun).toHaveBeenCalledWith('COMMIT');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Synced 0 maintenance forecast entries'
    });
  });

  test('rolls back and returns 500 on DB error', async () => {
    const req = {
      body: {
        forecasts: [
          {
            Material_ID: 1,
            Plant_ID: 101,
            AverageIntervalDays: 180
          }
        ]
      }
    };
    const res = mockResponse();

    mockRun
      .mockResolvedValueOnce() // BEGIN
      .mockRejectedValueOnce(new Error('Insert error')) // INSERT
      .mockResolvedValueOnce(); // ROLLBACK

    await syncMaterialMaintenanceForecasts(req, res);

    expect(mockRun).toHaveBeenCalledWith('ROLLBACK');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Insert error'
    });
  });
});
