import { jest } from '@jest/globals';

// Define mocks for database functions
const mockAll = jest.fn();
const mockGet = jest.fn();
const mockRun = jest.fn();

// Mock the entire Database.js module, including required named exports
jest.unstable_mockModule('../../../Database/Database.js', () => ({
  Predictions_DataDbInstance: {
    all: mockAll,
    get: mockGet,
    run: mockRun
  },
  processedDbInstance: {}, // mocked to avoid import error
  unprocessedDbInstance: {},
  InitializeDatabases: jest.fn(),
  startDatabases: jest.fn()
}));

let syncMaterialData;

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn();
  return res;
};

describe('syncMaterialData', () => {
  beforeAll(async () => {
    const module = await import('../SyncMaterialDataController.js');
    syncMaterialData = module.syncMaterialData;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 400 if materials is not an array', async () => {
    const req = { body: { materials: 'not-an-array' } };
    const res = mockResponse();

    await syncMaterialData(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid materials list'
    });
  });

  test('successfully inserts material, serial, and replacement part', async () => {
    const req = { body: { materials: ['MAT123'] } };
    const res = mockResponse();

    mockAll.mockResolvedValue([
      {
        Material: 'MAT123',
        MaterialCategory: 'Electrical',
        Description: 'Motor',
        ViolationReplacementPart: '1',
        Serial_No_Profile: 'SN-001',
        Plant: 'PLANT1'
      }
    ]);

    mockGet
      .mockResolvedValueOnce({ Material_ID: 1 }) // get Material_ID
      .mockResolvedValueOnce({ Plant_ID: 99 });  // get Plant_ID

    mockRun.mockResolvedValue();

    await syncMaterialData(req, res);

    expect(mockRun).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO Material'), expect.any(Array));
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO SerialNumberProfile'), expect.any(Array));
    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO ReplacementPart'), expect.any(Array));
    expect(mockRun).toHaveBeenCalledWith('COMMIT');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: expect.stringContaining('Material, ReplacementPart, and SerialNumberProfile tables synced')
    }));
  });

  test('warns and skips if no matching material is found', async () => {
    const req = { body: { materials: ['MISSINGMAT'] } };
    const res = mockResponse();

    mockAll.mockResolvedValue([]); // no material rows
    mockRun.mockResolvedValue();

    await syncMaterialData(req, res);

    expect(mockRun).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockRun).toHaveBeenCalledWith('COMMIT');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('rolls back on failure', async () => {
    const req = { body: { materials: ['FAILMAT'] } };
    const res = mockResponse();

    mockAll.mockResolvedValue([
      {
        Material: 'FAILMAT',
        MaterialCategory: 'Mech',
        Description: 'Broken Part',
        ViolationReplacementPart: '0',
        Serial_No_Profile: '',
        Plant: 'PLANTX'
      }
    ]);

    mockGet.mockRejectedValue(new Error('DB failure'));
    mockRun.mockResolvedValue(); // BEGIN, ROLLBACK

    await syncMaterialData(req, res);

    expect(mockRun).toHaveBeenCalledWith('ROLLBACK');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Failed to sync Material numbers',
      error: 'DB failure'
    }));
  });

  test('skips replacement part if plant is missing', async () => {
    const req = { body: { materials: ['MAT999'] } };
    const res = mockResponse();

    mockAll.mockResolvedValue([
      {
        Material: 'MAT999',
        MaterialCategory: 'Cat',
        Description: 'Desc',
        ViolationReplacementPart: '1',
        Serial_No_Profile: '',
        Plant: 'UNKNOWNPLANT'
      }
    ]);

    mockGet
      .mockResolvedValueOnce({ Material_ID: 3 }) // get Material_ID
      .mockResolvedValueOnce(null);              // missing Plant

    mockRun.mockResolvedValue();

    await syncMaterialData(req, res);

    expect(mockRun).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockRun).toHaveBeenCalledWith('COMMIT');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
