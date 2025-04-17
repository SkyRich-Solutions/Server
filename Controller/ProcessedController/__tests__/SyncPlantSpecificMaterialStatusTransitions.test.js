// Controller/ProcessedController/__tests__/SyncPlantSpecificMaterialStatusTransitions.test.js
import { jest } from '@jest/globals';

const mockAll = jest.fn();
const mockRun = jest.fn();

jest.unstable_mockModule('../../../Database/Database.js', () => ({
  Predictions_DataDbInstance: {
    all: mockAll,
    run: mockRun,
  },
  processedDbInstance: null,
  unprocessedDbInstance: null,
  InitializeDatabases: jest.fn(),
  startDatabases: jest.fn()
}));

const { syncPlantSpecificMaterialStatusTransitions } = await import('../SyncPlantSpecificMaterialStatusTransitions.js');
const { Predictions_DataDbInstance } = await import('../../../Database/Database.js');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn();
  return res;
};

describe('syncPlantSpecificMaterialStatusTransitions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 200 with message if no data rows exist', async () => {
    const req = {};
    const res = mockResponse();

    Predictions_DataDbInstance.all.mockResolvedValue([]);

    await syncPlantSpecificMaterialStatusTransitions(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'No data in MaterialData with timestamp.'
    });
  });

  test('skips rows with invalid/missing fields and commits valid transitions', async () => {
    const req = {};
    const res = mockResponse();

    Predictions_DataDbInstance.all.mockResolvedValue([
      {
        Material: 'MAT001',
        Plant: 'PLANT1',
        Description: 'Part A',
        PlantSpecificMaterialStatus: 'Z1',
        Timestamp: '2024-01-01T00:00:00Z'
      },
      {
        Material: 'MAT001',
        Plant: 'PLANT1',
        Description: 'Part A',
        PlantSpecificMaterialStatus: 'Z2',
        Timestamp: '2024-02-01T00:00:00Z'
      },
      {
        Material: '', // Invalid row
        Plant: 'PLANT1',
        Description: 'Broken Entry',
        PlantSpecificMaterialStatus: 'Z3',
        Timestamp: '2024-03-01T00:00:00Z'
      }
    ]);

    Predictions_DataDbInstance.run.mockResolvedValue();

    await syncPlantSpecificMaterialStatusTransitions(req, res);

    expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO MaterialStatusTransitions'),
      expect.arrayContaining(['MAT001', 'Part A', 'Z1', 'PLANT1', 'Z2', expect.any(Number), 'forward'])
    );
    expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith('COMMIT');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: expect.stringContaining('MaterialStatusTransitions synced'),
      inserted: 1
    }));
  });

  test('returns early if there are no transitions to sync', async () => {
    const req = {};
    const res = mockResponse();

    Predictions_DataDbInstance.all.mockResolvedValue([
      {
        Material: 'MAT002',
        Plant: 'PLANT2',
        Description: 'One Entry',
        PlantSpecificMaterialStatus: 'Z0',
        Timestamp: '2024-01-01T00:00:00Z'
      }
    ]);

    Predictions_DataDbInstance.run.mockResolvedValue();

    await syncPlantSpecificMaterialStatusTransitions(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'MaterialStatusTransitions synced from MaterialData.',
      inserted: 1
    }));
  });

  test('handles database error and rolls back', async () => {
    const req = {};
    const res = mockResponse();

    Predictions_DataDbInstance.all.mockResolvedValue([
      {
        Material: 'MAT001',
        Plant: 'PLANT1',
        Description: 'Part A',
        PlantSpecificMaterialStatus: 'Z1',
        Timestamp: '2024-01-01T00:00:00Z'
      },
      {
        Material: 'MAT001',
        Plant: 'PLANT1',
        Description: 'Part A',
        PlantSpecificMaterialStatus: 'Z2',
        Timestamp: '2024-02-01T00:00:00Z'
      }
    ]);

    Predictions_DataDbInstance.run
      .mockResolvedValueOnce() // BEGIN
      .mockRejectedValueOnce(new Error('Insert failed')) // INSERT
      .mockResolvedValueOnce(); // ROLLBACK

    await syncPlantSpecificMaterialStatusTransitions(req, res);

    expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith('ROLLBACK');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Insert failed'
    });
  });
});
