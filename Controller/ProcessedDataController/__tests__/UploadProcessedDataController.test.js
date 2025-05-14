import { jest } from '@jest/globals';

// ✅ Mock first before dynamic import
const mockRun = jest.fn();
const mockGet = jest.fn();
const mockAll = jest.fn();

jest.unstable_mockModule('../../../Database/Database.js', () => ({
  processedDbInstance: {
    run: mockRun,
    get: mockGet
  },
  Predictions_DataDbInstance: {
    run: mockRun,
    get: mockGet,
    all: mockAll
  },
  unprocessedDbInstance: {} // optional
}));

// ✅ Dynamic import AFTER mocks are defined
const {
  uploadProcessedTurbineData,
  uploadProcessedMaterialData,
  fetchReplacementParts,
  fetchPlantTable,
  fetchMaterialTable
} = await import('../UploadProcessedDataController.js');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('UploadProcessedDataController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadProcessedTurbineData', () => {
    it('should persist turbine data successfully', async () => {
      const req = {
        body: [{
          FunctionalLoc: 'LOC1',
          MaintPlant: 'PLANT1',
          TurbineLatitude: '56.123456',
          TurbineLongitude: '9.123456',
          UnknownLocation: '0'
        }]
      };
      const res = mockResponse();

      mockGet.mockResolvedValue(null);
      mockRun.mockResolvedValue();

      await uploadProcessedTurbineData(req, res);

      expect(mockRun).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 on invalid input', async () => {
      const req = { body: {} };
      const res = mockResponse();

      await uploadProcessedTurbineData(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('uploadProcessedMaterialData', () => {
    it('should persist material data to both DBs', async () => {
      const req = {
        body: [{
          Material: 'MAT123',
          Plant: 'PL1',
          Timestamp: '2024-04-17T00:00:00Z'
        }]
      };
      const res = mockResponse();

      mockGet.mockResolvedValue(null);
      mockRun.mockResolvedValue();

      await uploadProcessedMaterialData(req, res);

      expect(mockRun).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 on empty input', async () => {
      const req = { body: [] };
      const res = mockResponse();

      await uploadProcessedMaterialData(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('fetchReplacementParts', () => {
    it('should return replacement part rows', async () => {
      const mockRows = [{ Material_ID: 1 }];
      mockAll.mockResolvedValue(mockRows);
      const res = mockResponse();

      await fetchReplacementParts({}, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: mockRows });
    });

    it('should handle fetch error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockAll.mockRejectedValue(new Error('fail'));
      const res = mockResponse();

      await fetchReplacementParts({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      consoleSpy.mockRestore();
    });
  });

  describe('fetchPlantTable', () => {
    it('should return plant rows', async () => {
      const mockRows = [{ Plant_ID: 1 }];
      mockAll.mockResolvedValue(mockRows);
      const res = mockResponse();

      await fetchPlantTable({}, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ plants: mockRows });
    });
  });

  describe('fetchMaterialTable', () => {
    it('should return material rows', async () => {
      const mockRows = [{ Material_ID: 10 }];
      mockAll.mockResolvedValue(mockRows);
      const res = mockResponse();

      await fetchMaterialTable({}, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ materials: mockRows });
    });
  });
});
