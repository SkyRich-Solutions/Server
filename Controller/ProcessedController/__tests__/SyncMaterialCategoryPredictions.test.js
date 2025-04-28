import { jest } from '@jest/globals';

// Create mocks outside to reuse and reset in tests
const mockRun = jest.fn();

// Mock the module with all necessary exports
jest.unstable_mockModule('../../../Database/Database.js', () => ({
  Predictions_DataDbInstance: {
    run: mockRun
  },
  processedDbInstance: {}, // prevent import errors
  unprocessedDbInstance: {},
  InitializeDatabases: jest.fn(),
  startDatabases: jest.fn()
}));

let syncMaterialCategoryPredictionsController;

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn();
  return res;
};

describe('syncMaterialCategoryPredictionsController', () => {
  beforeAll(async () => {
    const controllerModule = await import('../SyncMaterialCategoryPredictions.js');
    syncMaterialCategoryPredictionsController = controllerModule.syncMaterialCategoryPredictionsController;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 400 for invalid input (not an array)', async () => {
    const req = {
      body: {
        predictions: 'invalid_data'
      }
    };
    const res = mockResponse();

    await syncMaterialCategoryPredictionsController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid predictions array'
    });
  });

  test('successfully syncs predictions', async () => {
    const req = {
      body: {
        predictions: [
          {
            Category: 'Electrical',
            BayesianProbability: 0.87,
            MonteCarloEstimate: 0.85,
            MonteCarlo_5th_Percentile: 0.75,
            MonteCarlo_50th_Percentile: 0.85,
            MonteCarlo_95th_Percentile: 0.95
          }
        ]
      }
    };
    const res = mockResponse();

    mockRun.mockResolvedValue();

    await syncMaterialCategoryPredictionsController(req, res);

    expect(mockRun).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO MaterialCategoryPredictions'), expect.any(Array));
    expect(mockRun).toHaveBeenCalledWith('COMMIT');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Category predictions synced with confidence intervals.'
    });
  });

  test('skips rows with missing Category and commits the rest', async () => {
    const req = {
      body: {
        predictions: [
          { BayesianProbability: 0.9 },
          {
            Category: 'Mechanical',
            BayesianProbability: 0.8,
            MonteCarloEstimate: 0.78,
            MonteCarlo_5th_Percentile: 0.7,
            MonteCarlo_50th_Percentile: 0.78,
            MonteCarlo_95th_Percentile: 0.88
          }
        ]
      }
    };
    const res = mockResponse();

    mockRun.mockResolvedValue();

    await syncMaterialCategoryPredictionsController(req, res);

    expect(mockRun).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO MaterialCategoryPredictions'), expect.any(Array));
    expect(mockRun).toHaveBeenCalledWith('COMMIT');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('rolls back and returns 500 on failure', async () => {
    const req = {
      body: {
        predictions: [
          {
            Category: 'Electrical',
            BayesianProbability: 0.87
          }
        ]
      }
    };
    const res = mockResponse();

    mockRun
      .mockResolvedValueOnce() // BEGIN
      .mockRejectedValueOnce(new Error('Database error')) // INSERT
      .mockResolvedValueOnce(); // ROLLBACK

    await syncMaterialCategoryPredictionsController(req, res);

    expect(mockRun).toHaveBeenCalledWith('ROLLBACK');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Database error'
    });
  });
});
