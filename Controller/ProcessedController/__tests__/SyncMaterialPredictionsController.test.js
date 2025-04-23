import { jest } from '@jest/globals';

const mockRun = jest.fn();
const mockGet = jest.fn();

jest.unstable_mockModule('../../../Database/Database.js', () => ({
  Predictions_DataDbInstance: {
    run: mockRun,
    get: mockGet
  }
}));

let syncReplacementPredictionsController;

beforeAll(async () => {
  const controller = await import('../SyncMaterialPredictionsController.js');
  syncReplacementPredictionsController = controller.syncReplacementPredictionsController;
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

describe('syncReplacementPredictionsController', () => {
  test('syncs all prediction types successfully', async () => {
    const req = {
      body: {
        overall: [{ Description: 'Motor', Total_Count: 100, Count_B: 40, Probability: 0.4 }],
        by_plant: [{ Description: 'Motor', Plant: 'PLANT1', Total_Count: 20, Count_B: 10, Probability: 0.5 }],
        monte_carlo_simulation: [{ Description: 'Motor', DominanceCount: 90, Percentage: 75.5 }]
      }
    };
    const res = mockResponse();

    mockGet
      .mockResolvedValueOnce({ Material_ID: 1, MaterialCategory: 'Electrical' }) // overall
      .mockResolvedValueOnce({ Material_ID: 1, MaterialCategory: 'Electrical' }) // by_plant
      .mockResolvedValueOnce({ Plant_ID: 2 });                                   // plant lookup

    mockRun.mockResolvedValue();

    await syncReplacementPredictionsController(req, res);

    expect(mockRun).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockRun).toHaveBeenCalledWith('COMMIT');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: ' Replacement predictions synced successfully'
    });
  });

  test('skips global prediction with missing description', async () => {
    const req = { body: { overall: [{ Description: null, Probability: 0.8 }] } };
    const res = mockResponse();

    mockRun.mockResolvedValue();

    await syncReplacementPredictionsController(req, res);

    expect(mockRun).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockRun).toHaveBeenCalledWith('COMMIT');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('skips plant-scoped prediction with missing plant', async () => {
    const req = { body: { by_plant: [{ Description: 'Motor', Plant: 'UNKNOWN', Probability: 0.5 }] } };
    const res = mockResponse();

    mockGet
      .mockResolvedValueOnce({ Material_ID: 1, MaterialCategory: 'Electro' }) // material
      .mockResolvedValueOnce(null); // plant not found

    mockRun.mockResolvedValue();

    await syncReplacementPredictionsController(req, res);

    expect(mockRun).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockRun).toHaveBeenCalledWith('COMMIT');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('rolls back and returns 500 on database failure', async () => {
    const req = {
      body: {
        overall: [{ Description: 'Motor', Probability: 0.7 }]
      }
    };
    const res = mockResponse();

    mockGet.mockResolvedValue({ Material_ID: 1, MaterialCategory: 'X' });
    mockRun
      .mockResolvedValueOnce() // BEGIN
      .mockRejectedValueOnce(new Error('DB crash')) // INSERT
      .mockResolvedValueOnce(); // ROLLBACK

    await syncReplacementPredictionsController(req, res);

    expect(mockRun).toHaveBeenCalledWith('ROLLBACK');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'DB crash'
    });
  });
});
