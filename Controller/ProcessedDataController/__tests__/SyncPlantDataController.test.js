// Controller/ProcessedController/__tests__/SyncPlantDataController.test.js
import { jest } from '@jest/globals';

// Setup mock database exports
const mockRun = jest.fn();
const mockGet = jest.fn();
const mockAll = jest.fn();

jest.unstable_mockModule('../../../Database/Database.js', () => ({
  processedDbInstance: {
    run: mockRun,
    get: mockGet,
    all: mockAll
  },
  Predictions_DataDbInstance: {
    run: mockRun,
    get: mockGet,
    all: mockAll
  },
  unprocessedDbInstance: null,
  InitializeDatabases: jest.fn(),
  startDatabases: jest.fn()
}));

// Load the controller AFTER mocking
let syncPlantCoordinates, syncPlantData, __setGeoMapping;
let processedDbInstance;

beforeAll(async () => {
  const controllerModule = await import('../SyncPlantDataController.js');
  syncPlantCoordinates = controllerModule.syncPlantCoordinates;
  syncPlantData = controllerModule.syncPlantData;
  __setGeoMapping = controllerModule.__setGeoMapping;

  const dbModule = await import('../../../Database/Database.js');
  processedDbInstance = dbModule.processedDbInstance;
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

describe('SyncPlantDataController', () => {
  test('returns 400 if plants is not an array', async () => {
    const req = { body: { plants: 'invalid' } };
    const res = mockResponse();

    await syncPlantCoordinates(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid plant list'
    });
  });

  test('successfully inserts plant with mapped coordinates', async () => {
    const req = {
      body: {
        plants: [{
          code: '15S1',
          isPlant: true,
          isPlanningPlant: false,
          isManufacturingPlant: true
        }]
      }
    };
    const res = mockResponse();

    mockGet.mockResolvedValue(null);
    mockRun.mockResolvedValue();
    __setGeoMapping({ '15': [56.1, 9.4] });

    await syncPlantCoordinates(req, res);

    expect(mockRun).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO Plant'), expect.any(Array));
    expect(mockRun).toHaveBeenCalledWith('COMMIT');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: ' Plant table updated with roles & coordinates'
    });
  });

  test('uses default coordinates if geoMapping is missing', async () => {
    const req = {
      body: {
        plants: [{ code: 'XX01', isPlant: true }]
      }
    };
    const res = mockResponse();

    mockGet.mockResolvedValue(null);
    mockRun.mockResolvedValue();
    __setGeoMapping({}); // No matching prefix

    await syncPlantCoordinates(req, res);

    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO Plant'), expect.arrayContaining([
      expect.any(String), 55.9429, 9.1257 // fallback coords
    ]));
  });

  test('skips plant entry with missing code', async () => {
    const req = {
      body: {
        plants: [{ isPlant: true }]
      }
    };
    const res = mockResponse();

    mockRun.mockResolvedValue();

    await syncPlantCoordinates(req, res);

    expect(mockRun).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockRun).toHaveBeenCalledWith('COMMIT');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('rolls back on error during plant sync', async () => {
    const req = {
      body: {
        plants: [{
          code: 'FAIL01',
          isPlant: true
        }]
      }
    };
    const res = mockResponse();

    mockGet.mockResolvedValue(null);
    mockRun
      .mockResolvedValueOnce() // BEGIN
      .mockRejectedValueOnce(new Error('Insert failed')) // INSERT
      .mockResolvedValueOnce(); // ROLLBACK

    await syncPlantCoordinates(req, res);

    expect(mockRun).toHaveBeenCalledWith('ROLLBACK');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to sync plant roles',
      error: 'Insert failed'
    });
  });

  test('syncPlantData returns plant table rows', async () => {
    const req = {};
    const res = mockResponse();

    const mockRows = [{ Plant_Name: '15S1', IsPlant: 1, Plant_Latitude: 56.1 }];
    mockAll.mockResolvedValue(mockRows);

    await syncPlantData(req, res);

    expect(mockAll).toHaveBeenCalledWith(' SELECT * FROM Plant');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockRows);
  });

  test('syncPlantData handles fetch errors', async () => {
    const req = {};
    const res = mockResponse();

    mockAll.mockRejectedValue(new Error('SELECT failed'));

    await syncPlantData(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to sync plant data',
      error: 'SELECT failed'
    });
  });
});
