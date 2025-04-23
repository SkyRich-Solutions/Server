import { jest } from '@jest/globals';

const mockRun = jest.fn();
const mockAll = jest.fn();
const mockGet = jest.fn();

jest.unstable_mockModule('../../../Database/Database.js', () => ({
  Predictions_DataDbInstance: {
    run: mockRun,
    all: mockAll,
    get: mockGet
  },
  unprocessedDbInstance: { run: jest.fn(), all: jest.fn() },
  processedDbInstance: { run: jest.fn(), all: jest.fn() },
  InitializeDatabases: jest.fn(),
  startDatabases: jest.fn()
}));

let syncFaultReportsController, verifyTechnicianLinksController, syncFaultReports, verifyTechnicianLinks;

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn();
  return res;
};

describe('SyncFaultReportsController', () => {
  beforeAll(async () => {
    const module = await import('../SyncFaultReportsController.js');
    syncFaultReportsController = module.syncFaultReportsController;
    verifyTechnicianLinksController = module.verifyTechnicianLinksController;
    syncFaultReports = module.syncFaultReports;
    verifyTechnicianLinks = module.verifyTechnicianLinks;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('syncFaultReportsController - success', async () => {
    const req = {};
    const res = mockResponse();

    mockAll
      .mockResolvedValueOnce([{ Technician_ID: 1 }]) // technician list
      .mockResolvedValueOnce([]); // materialsWithB

    mockRun.mockResolvedValue();

    await syncFaultReportsController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: ' FaultReports synced from ReplacementParts'
    });
  });

  test('syncFaultReportsController - DB failure', async () => {
    const req = {};
    const res = mockResponse();

    mockAll.mockRejectedValueOnce(new Error('DB error'));

    await syncFaultReportsController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'DB error'
    });
  });

  test('verifyTechnicianLinksController - success', async () => {
    const req = {};
    const res = mockResponse();

    mockAll.mockResolvedValue([
      {
        Report_ID: 1,
        Technician_ID: 101,
        Name: 'Alice',
        Surname: 'Smith'
      }
    ]);

    await verifyTechnicianLinksController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [
        {
          Report_ID: 1,
          Technician_ID: 101,
          Name: 'Alice',
          Surname: 'Smith'
        }
      ]
    });
  });

  test('verifyTechnicianLinksController - throws error', async () => {
    const req = {};
    const res = mockResponse();

    mockAll.mockRejectedValue(new Error('Query fail'));

    await verifyTechnicianLinksController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to verify links',
      error: 'Query fail'
    });
  });

  test('syncFaultReports - no technicians found', async () => {
    mockAll.mockResolvedValueOnce([]); // No techs

    await expect(syncFaultReports({ all: mockAll, run: mockRun })).rejects.toThrow(
      'No technicians found in PredictionsDb database'
    );
  });

  test('verifyTechnicianLinks - returns structured results', async () => {
    mockAll.mockResolvedValue([
      { Report_ID: 1, Technician_ID: 999, Name: null, Surname: null }
    ]);

    const results = await verifyTechnicianLinks({ all: mockAll });
    expect(results.length).toBe(1);
    expect(results[0].Technician_ID).toBe(999);
  });
});
