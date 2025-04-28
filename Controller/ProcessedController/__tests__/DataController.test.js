import { jest } from '@jest/globals';

const mockUnprocessedAll = jest.fn();
const mockProcessedAll = jest.fn();
const mockPredictionsAll = jest.fn();

jest.unstable_mockModule('../../../Database/Database.js', () => ({
  unprocessedDbInstance: { all: mockUnprocessedAll },
  processedDbInstance: { all: mockProcessedAll },
  Predictions_DataDbInstance: { all: mockPredictionsAll },
  InitializeDatabases: jest.fn(),
  startDatabases: jest.fn()
}));

let getUnprocessedTurbineData,
  getUnprocessedMaterialData,
  getProcessedMaterialData,
  getProcessedTurbineData,
  getPredictionsData,
  getTechnicians,
  getLocations;

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn();
  return res;
};

describe('DataController', () => {
  beforeAll(async () => {
    const controller = await import('../DataController.js');
    getUnprocessedTurbineData = controller.getUnprocessedTurbineData;
    getUnprocessedMaterialData = controller.getUnprocessedMaterialData;
    getProcessedMaterialData = controller.getProcessedMaterialData;
    getProcessedTurbineData = controller.getProcessedTurbineData;
    getPredictionsData = controller.getPredictionsData;
    getTechnicians = controller.getTechnicians;
    getLocations = controller.getLocations;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getUnprocessedTurbineData - success', async () => {
    const req = {};
    const res = mockResponse();
    const mockData = [{ id: 1, name: 'Turbine A' }];

    mockUnprocessedAll.mockResolvedValue(mockData);
    await getUnprocessedTurbineData(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
  });

  test('getUnprocessedMaterialData - error', async () => {
    const req = {};
    const res = mockResponse();

    mockUnprocessedAll.mockRejectedValue(new Error('DB error'));
    await getUnprocessedMaterialData(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.any(String),
      error: 'DB error'
    }));
  });

  test('getProcessedMaterialData - success', async () => {
    const req = {};
    const res = mockResponse();
    const mockData = [{ id: 1, name: 'Material A' }];

    mockProcessedAll.mockResolvedValue(mockData);
    await getProcessedMaterialData(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
  });

  test('getProcessedTurbineData - success', async () => {
    const req = {};
    const res = mockResponse();
    const mockData = [{ id: 1, name: 'Turbine B' }];

    mockProcessedAll.mockResolvedValue(mockData);
    await getProcessedTurbineData(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
  });

  test('getPredictionsData - success', async () => {
    const req = {};
    const res = mockResponse();
    const mockData = [{ id: 1, prediction: 'A' }];

    mockPredictionsAll.mockResolvedValue(mockData);
    await getPredictionsData(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
  });

  test('getTechnicians - empty data', async () => {
    const req = {};
    const res = mockResponse();

    mockPredictionsAll.mockResolvedValue(null);
    await getTechnicians(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
  });

  test('getLocations - error', async () => {
    const req = {};
    const res = mockResponse();

    mockPredictionsAll.mockRejectedValue(new Error('Query failed'));
    await getLocations(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Failed to fetch location data',
      error: 'Query failed'
    }));
  });
});
