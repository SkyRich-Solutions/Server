import { jest } from '@jest/globals';

const mockUnprocessedAll = jest.fn();
const mockProcessedAll = jest.fn();
const mockPredictionsAll = jest.fn();

// Correct ESM mock setup
jest.unstable_mockModule('../../../Database/Database.js', () => ({
  unprocessedDbInstance: { all: mockUnprocessedAll },
  processedDbInstance: { all: mockProcessedAll },
  Predictions_DataDbInstance: { all: mockPredictionsAll },
  InitializeDatabases: jest.fn(),
  startDatabases: jest.fn()
}));

let MaintPlant, PlanningPlant, MainAndPlanningPlant;
let WarehousePlanningPlant, WarehouseManufacturingPlant, WarehousePlant;

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn();
  return res;
};

describe('MapsController', () => {
  beforeAll(async () => {
    const module = await import('../MapsController.js');
    MaintPlant = module.MaintPlant;
    PlanningPlant = module.PlanningPlant;
    MainAndPlanningPlant = module.MainAndPlanningPlant;
    WarehousePlanningPlant = module.WarehousePlanningPlant;
    WarehouseManufacturingPlant = module.WarehouseManufacturingPlant;
    WarehousePlant = module.WarehousePlant;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('MaintPlant - success', async () => {
    const req = {};
    const res = mockResponse();
    const mockData = [{ id: 1, MaintPlant: '50S1' }];

    mockUnprocessedAll.mockResolvedValue(mockData);
    await MaintPlant(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
  });

  test('PlanningPlant - failure', async () => {
    const req = {};
    const res = mockResponse();

    mockUnprocessedAll.mockRejectedValue(new Error('DB fail'));
    await PlanningPlant(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Failed to fetch PlanningPlant data',
      error: 'DB fail'
    }));
  });

  test('MainAndPlanningPlant - success', async () => {
    const req = {};
    const res = mockResponse();
    const mockData = [{ id: 1, MaintPlant: 'A', PlanningPlant: 'B' }];

    mockUnprocessedAll.mockResolvedValue(mockData);
    await MainAndPlanningPlant(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
  });

  test('WarehousePlanningPlant - success', async () => {
    const req = {};
    const res = mockResponse();
    const mockData = [{ id: 1, IsPlanningPlant: 1 }];

    mockPredictionsAll.mockResolvedValue(mockData);
    await WarehousePlanningPlant(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
  });

  test('WarehouseManufacturingPlant - failure', async () => {
    const req = {};
    const res = mockResponse();

    mockPredictionsAll.mockRejectedValue(new Error('Manufacturing error'));
    await WarehouseManufacturingPlant(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Failed to fetch WarehouseManufacturingPlant',
      error: 'Manufacturing error'
    }));
  });

  test('WarehousePlant - success', async () => {
    const req = {};
    const res = mockResponse();
    const mockData = [{ id: 1, IsPlant: 1 }];

    mockPredictionsAll.mockResolvedValue(mockData);
    await WarehousePlant(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
  });
});
