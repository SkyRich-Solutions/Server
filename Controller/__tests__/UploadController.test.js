import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mocks before imports
jest.unstable_mockModule('fs', () => ({
  default: {
    readFile: jest.fn(),
    unlinkSync: jest.fn(),
  },
}));

jest.unstable_mockModule('papaparse', () => ({
  default: {
    parse: jest.fn((data, config) => config.complete({ data: JSON.parse(data) })),
  },
}));

jest.unstable_mockModule('../../Database/Database.js', () => ({
  unprocessedDbInstance: {
    run: jest.fn(),
    all: jest.fn(),
  },
  Predictions_DataDbInstance: {
    run: jest.fn(),
    all: jest.fn(),
  }
}));

// Actual imports after mocks
const fs = (await import('fs')).default;
const Papa = (await import('papaparse')).default;
const {
  uploadCSV,
  getUnprocessedTurbineData,
  getUnprocessedMaterialData,
  UploadFaultReport,
} = await import('../UploadController.js');
const {
  unprocessedDbInstance,
  Predictions_DataDbInstance,
} = await import('../../Database/Database.js');

// Mock response factory
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn();
  return res;
};

describe('UploadController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadCSV', () => {
    const materialCSV = JSON.stringify([{
      Material: 'M1',
      Description: 'Motor',
      Plant: 'PL1',
      'Plant-Specific Material Status': 'active',
      'Batch Management(Plant)': 'Y',
      'Serial No. Profile': 'SN001',
      'Replacement Part': '1',
      'Used in a S-bom': 'Yes'
    }]);

    test('returns 400 if no file uploaded', async () => {
      const req = {};
      const res = mockResponse();
      await uploadCSV(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No file uploaded'
      });
    });

    test('inserts MaterialData successfully', async () => {
      fs.readFile.mockImplementation((_, __, cb) => cb(null, materialCSV));
      const req = { file: { path: 'uploads/test.csv' } };
      const res = mockResponse();

      await uploadCSV(req, res);

      expect(unprocessedDbInstance.run).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalledWith('uploads/test.csv');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('MaterialData')
      }));
    });

    test('returns 400 if CSV headers don’t match', async () => {
      fs.readFile.mockImplementation((_, __, cb) => cb(null, JSON.stringify([{ unknown: 'header' }])));
      const req = { file: { path: 'uploads/bad.csv' } };
      const res = mockResponse();

      await uploadCSV(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        expectedHeaders: expect.any(Array)
      }));
    });

    test('handles readFile error and unlinks file', async () => {
      fs.readFile.mockImplementation((_, __, cb) => cb(new Error('fail')));
      const req = { file: { path: 'uploads/fail.csv' } };
      const res = mockResponse();

      await uploadCSV(req, res);

      expect(fs.unlinkSync).toHaveBeenCalledWith('uploads/fail.csv');
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUnprocessedTurbineData', () => {
    test('returns data', async () => {
      const res = mockResponse();
      unprocessedDbInstance.all.mockResolvedValue([{ id: 1 }]);
      await getUnprocessedTurbineData({}, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('returns 404 if empty', async () => {
      const res = mockResponse();
      unprocessedDbInstance.all.mockResolvedValue([]);
      await getUnprocessedTurbineData({}, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 500 on DB error', async () => {
      const res = mockResponse();
      unprocessedDbInstance.all.mockRejectedValue(new Error('db error'));
      await getUnprocessedTurbineData({}, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUnprocessedMaterialData', () => {
    test('returns data', async () => {
      const res = mockResponse();
      unprocessedDbInstance.all.mockResolvedValue([{ id: 1 }]);
      await getUnprocessedMaterialData({}, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('returns 404 if empty', async () => {
      const res = mockResponse();
      unprocessedDbInstance.all.mockResolvedValue([]);
      await getUnprocessedMaterialData({}, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 500 on DB error', async () => {
      const res = mockResponse();
      unprocessedDbInstance.all.mockRejectedValue(new Error('db error'));
      await getUnprocessedMaterialData({}, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('UploadFaultReport', () => {
    test('returns 400 for missing fields', async () => {
      const req = { body: {}, file: null };
      const res = mockResponse();
      await UploadFaultReport(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('submits fault report successfully', async () => {
      const req = {
        body: {
          Technician_ID: 1,
          TurbineLocation: 101,
          Report_Date: '2024-01-01',
          Fault_Description: 'Broken blade',
          Report_Status: 'Open'
        },
        file: { buffer: Buffer.from('abc') }
      };
      const res = mockResponse();
      Predictions_DataDbInstance.run.mockResolvedValue();
      await UploadFaultReport(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('handles DB error', async () => {
      const req = {
        body: {
          Technician_ID: 1,
          TurbineLocation: 101,
          Report_Date: '2024-01-01',
          Fault_Description: 'Broken blade',
          Report_Status: 'Open'
        },
        file: { buffer: Buffer.from('abc') }
      };
      const res = mockResponse();
      Predictions_DataDbInstance.run.mockRejectedValue(new Error('insert error'));
      await UploadFaultReport(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});