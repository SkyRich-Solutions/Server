import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../Database/Database.js', () => ({
  processedDbInstance: {
    all: jest.fn()
  }
}));

describe('ViolationController', () => {
  let processedDbInstance;
  let endpoints;

  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
    return res;
  };

  beforeAll(async () => {
    const dbModule = await import('../../../Database/Database.js');
    processedDbInstance = dbModule.processedDbInstance;

    const controller = await import('../ViolationController.js');

    endpoints = [
      { name: 'getViolations', handler: controller.getViolations, sql: 'SELECT COUNT(*) AS total_violations FROM MaterialData WHERE ViolationReplacementPart = 1' },
      { name: 'getViolations0', handler: controller.getViolations0, sql: 'SELECT COUNT(*) AS total_violations FROM MaterialData WHERE ViolationReplacementPart = 0' },
      { name: 'getTurbineViolation', handler: controller.getTurbineViolation, sql: 'SELECT COUNT(*) AS total_violations FROM TurbineData WHERE UnknownMaintPlant = 1 OR UnknownPlanningPlant = 1' },
      { name: 'getTurbineViolation0', handler: controller.getTurbineViolation0, sql: 'SELECT COUNT(*) AS total_violations FROM TurbineData WHERE UnknownMaintPlant = 0 AND UnknownPlanningPlant = 0' },
      { name: 'getMaterialClassified', handler: controller.getMaterialClassified, sql: `SELECT COUNT(*) AS total_violations FROM MaterialData WHERE MaterialCategory = 'Electrical'` },
      { name: 'getMaterialUnclassified', handler: controller.getMaterialUnclassified, sql: `SELECT COUNT(*) AS total_violations FROM MaterialData WHERE MaterialCategory = 'Unclassified'` },
      { name: 'getMaterialUnknownPlant', handler: controller.getMaterialUnknownPlant, sql: `SELECT COUNT(*) AS total_violations FROM MaterialData WHERE UnknownPlant = 'Unknown'` },
      { name: 'getMaterialKnownPlant', handler: controller.getMaterialKnownPlant, sql: `SELECT COUNT(*) AS total_violations FROM MaterialData WHERE UnknownPlant = 'Known'` }
    ];
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('runs all controller endpoint tests', async () => {
    for (const { name, handler, sql } of endpoints) {
      const mockData = [{ total_violations: 5 }];
      processedDbInstance.all.mockResolvedValue(mockData);

      const req = {};
      const res = mockResponse();

      await handler(req, res);

      expect(processedDbInstance.all).toHaveBeenCalledWith(sql);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });

      processedDbInstance.all.mockRejectedValue(new Error('DB failure'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('Failed'),
        error: 'DB failure'
      }));

      jest.clearAllMocks(); // Clear between each loop
    }
  });
});
