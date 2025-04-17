// Controller/ProcessedController/__tests__/UploadPredictionsDataController.test.js
import { jest } from '@jest/globals';

// ✅ Mock the full database module to avoid import errors
jest.unstable_mockModule('../../../Database/Database.js', () => ({
  unprocessedDbInstance: null,
  processedDbInstance: null,
  Predictions_DataDbInstance: {
    get: jest.fn(),
    run: jest.fn(),
    all: jest.fn()
  }
}));

// ✅ Import the controller after the mocks
const {
  uploadMaterialPredictionsData,
  uploadTurbinePredictionsData
} = await import('../UploadPredictionsDataController.js');

const { Predictions_DataDbInstance } = await import('../../../Database/Database.js');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn();
  return res;
};

describe('UploadPredictionsDataController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────────
  describe('uploadMaterialPredictionsData', () => {
    test('returns 400 if material data is invalid', async () => {
      const req = { body: null };
      const res = mockResponse();

      await uploadMaterialPredictionsData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid data format'
      });
    });

    test('inserts or updates material data successfully', async () => {
      const req = {
        body: [{
          Material: 'MAT123',
          Plant: 'PL01',
          Description: 'Sample Part'
        }]
      };
      const res = mockResponse();

      Predictions_DataDbInstance.get.mockResolvedValue(null); // No existing record
      Predictions_DataDbInstance.run.mockResolvedValue();

      await uploadMaterialPredictionsData(req, res);

      expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith('BEGIN TRANSACTION');
      expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO MaterialData'), expect.any(Array));
      expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith('COMMIT');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('rolls back and returns 500 on error', async () => {
      const req = { body: [{ Material: 'MAT001', Plant: 'PL01' }] };
      const res = mockResponse();

      Predictions_DataDbInstance.get.mockRejectedValue(new Error('DB Error'));
      Predictions_DataDbInstance.run.mockResolvedValue();

      await uploadMaterialPredictionsData(req, res);

      expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith('ROLLBACK');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  // ────────────────────────────────────────────────
  describe('uploadTurbinePredictionsData', () => {
    test('returns 400 if turbine data is invalid', async () => {
      const req = { body: [] };
      const res = mockResponse();

      await uploadTurbinePredictionsData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid TurbineData format'
      });
    });

    test('inserts or updates turbine data successfully', async () => {
      const req = {
        body: [{
          FunctionalLoc: 'FL01',
          MaintPlant: 'MP01',
          Description: 'Turbine A',
          UnknownLocation: 1
        }]
      };
      const res = mockResponse();

      Predictions_DataDbInstance.get.mockResolvedValue(null); // No existing turbine
      Predictions_DataDbInstance.run.mockResolvedValue();

      await uploadTurbinePredictionsData(req, res);

      expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith('BEGIN TRANSACTION');
      expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO TurbineData'), expect.any(Array));
      expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith('COMMIT');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('skips turbine record if missing FunctionalLoc or MaintPlant', async () => {
      const req = {
        body: [{
          Description: 'Turbine with missing data'
        }]
      };
      const res = mockResponse();

      Predictions_DataDbInstance.run.mockResolvedValue();

      await uploadTurbinePredictionsData(req, res);

      expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith('BEGIN TRANSACTION');
      expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith('COMMIT');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('rolls back and returns 500 on turbine upload failure', async () => {
      const req = {
        body: [{
          FunctionalLoc: 'FL_ERR',
          MaintPlant: 'MP_ERR',
          UnknownLocation: '0'
        }]
      };
      const res = mockResponse();

      Predictions_DataDbInstance.get.mockResolvedValue(null);
      Predictions_DataDbInstance.run.mockRejectedValueOnce(new Error('Insert failed'));
      Predictions_DataDbInstance.run.mockResolvedValue(); // For rollback

      await uploadTurbinePredictionsData(req, res);

      expect(Predictions_DataDbInstance.run).toHaveBeenCalledWith('ROLLBACK');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });
});
