import { jest } from '@jest/globals';

const mockRun = jest.fn();

jest.unstable_mockModule('../../../Database/Database.js', () => ({
  Predictions_DataDbInstance: {
    run: mockRun
  },
  processedDbInstance: {},
  unprocessedDbInstance: {},
  InitializeDatabases: jest.fn(),
  startDatabases: jest.fn()
}));

let syncMaterialCategoryHealthScores;

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn();
  return res;
};

describe('syncMaterialCategoryHealthScores', () => {
  beforeAll(async () => {
    const controllerModule = await import('../SyncMaterialCategoryHealthScores.js');
    syncMaterialCategoryHealthScores = controllerModule.syncMaterialCategoryHealthScores;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 400 for invalid payload', async () => {
    const req = {
      body: {
        plant_scores: 'invalid',
        summary_scores: []
      }
    };
    const res = mockResponse();

    await syncMaterialCategoryHealthScores(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid payload. Expected 'plant_scores' and 'summary_scores' arrays."
    });
  });

  test('should sync scores successfully', async () => {
    const req = {
      body: {
        plant_scores: [
          {
            Category: 'Electrical',
            Plant: '15S1',
            HealthScore: 88.5,
            LastUpdated: '2025-04-17T10:00:00Z'
          }
        ],
        summary_scores: [
          {
            Category: 'Electrical',
            TotalCategoryScore: 88.5,
            LastUpdated: '2025-04-17T10:00:00Z'
          }
        ]
      }
    };
    const res = mockResponse();

    mockRun.mockResolvedValue();

    await syncMaterialCategoryHealthScores(req, res);

    expect(mockRun).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO MaterialCategoryHealthScores'), expect.any(Array));
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO MaterialCategoryScoreSummary'), expect.any(Array));
    expect(mockRun).toHaveBeenCalledWith('COMMIT');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: expect.stringContaining('Inserted 1 plant scores and 1 summary scores')
    }));
  });

  test('should rollback and return 500 on error', async () => {
    const req = {
      body: {
        plant_scores: [
          {
            Category: 'Electrical',
            Plant: '15S1',
            HealthScore: 88.5
          }
        ],
        summary_scores: []
      }
    };
    const res = mockResponse();

    mockRun
      .mockResolvedValueOnce() // BEGIN
      .mockRejectedValueOnce(new Error('DB Insert Error')) // INSERT
      .mockResolvedValueOnce(); // ROLLBACK

    await syncMaterialCategoryHealthScores(req, res);

    expect(mockRun).toHaveBeenCalledWith('ROLLBACK');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'DB Insert Error'
    });
  });

  test('should handle missing fields gracefully', async () => {
    const req = {
      body: {
        plant_scores: [
          {
            Category: null,
            Plant: '',
            HealthScore: 'invalid'
          }
        ],
        summary_scores: [
          {
            Category: null,
            TotalCategoryScore: 'invalid'
          }
        ]
      }
    };
    const res = mockResponse();

    mockRun.mockResolvedValue();

    await syncMaterialCategoryHealthScores(req, res);

    expect(mockRun).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockRun).toHaveBeenCalledWith('COMMIT');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: expect.stringContaining('Inserted 0 plant scores and 0 summary scores')
    }));
  });
});
