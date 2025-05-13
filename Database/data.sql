
-- Predictions Database ---------------------------------------------

-- Drop tables if they exist  
DROP TABLE IF EXISTS TurbineMaintenanceLog;  
DROP TABLE IF EXISTS Technician;  
DROP TABLE IF EXISTS ReplacementPart;  
DROP TABLE IF EXISTS FaultReport;  
DROP TABLE IF EXISTS Deliveries;  
DROP TABLE IF EXISTS Attachment;  
DROP TABLE IF EXISTS SerialNumberProfile;  
DROP TABLE IF EXISTS Material;  
DROP TABLE IF EXISTS BatchManagement;  
DROP TABLE IF EXISTS SCADA;  
DROP TABLE IF EXISTS Turbine;  
DROP TABLE IF EXISTS DemandForecastingData;  
DROP TABLE IF EXISTS Plant;  
DROP TABLE IF EXISTS MaintenancePlant;  
DROP TABLE IF EXISTS PlanningPlant;  
DROP TABLE IF EXISTS ManufacturingPlant;  
DROP TABLE IF EXISTS PlantMaterialStatus;  
DROP TABLE IF EXISTS Location;
DROP TABLE IF EXISTS ReplacementPrediction;
DROP TABLE IF EXISTS ReplacementPredictionGlobal;
DROP TABLE IF EXISTS MonteCarloDominance;
DROP TABLE IF EXISTS ReplacementTrends;  
DROP TABLE IF EXISTS MaterialCategoryPredictions;
DROP TABLE IF EXISTS MaterialStatusTransitions;
DROP TABLE IF EXISTS MaterialCategoryHealthScores;
DROP TABLE IF EXISTS MaterialCategoryScoreSummary;
DROP TABLE IF EXISTS MaintenanceForecasts;
DROP TABLE IF EXISTS MaterialComponentHealthScore;
DROP TABLE IF EXISTS MaterialComponentScoreSummary;

DROP TABLE IF EXISTS MaterialData;
DROP TABLE IF EXISTS TurbineData;



-- Enable foreign key constraints
PRAGMA foreign_keys = ON;


CREATE TABLE IF NOT EXISTS MaterialData (
    Material TEXT,
    Plant TEXT,
    Description TEXT,
    PlantSpecificMaterialStatus TEXT,
    BatchManagementPlant TEXT,
    Serial_No_Profile TEXT,
    ReplacementPart TEXT,
    UsedInSBom TEXT,
    ViolationReplacementPart TEXT,
    MaterialCategory TEXT,
    UnknownPlant TEXT,
    Auto_Classified INTEGER DEFAULT 0,
    NewlyDiscovered INTEGER DEFAULT 0,
    Manually_Classified INTEGER DEFAULT 0,
    Timestamp TEXT,
    PRIMARY KEY (Material, Plant),
    FOREIGN KEY (Plant) REFERENCES Plant(Plant_Code)
        ON UPDATE CASCADE 
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS TurbineData (
    FunctionalLoc TEXT PRIMARY KEY,
    Description TEXT,
    MaintPlant TEXT,  -- Must match MaterialData.Plant
    PlanningPlant TEXT,
    Platform TEXT,
    WTShortName TEXT,
    TurbineModel TEXT,
    MkVersion TEXT,
    Revision TEXT,
    NominalPower TEXT,
    OriginalEqManufact TEXT,
    SBOMForTurbine TEXT,
    SCADAName TEXT,
    SCADAParkID TEXT,
    SCADACode TEXT,
    SCADAFunctionalLoc TEXT,
    TechID TEXT UNIQUE,
    Region TEXT,
    Technology TEXT,
    HubHeight TEXT,
    TowerHeight TEXT,
    TurbineClass TEXT,
    TurbineLatitude REAL,
    TurbineLongitude REAL,
    UnknownMaintPlant TEXT,
    UnknownPlanningPlant TEXT,
    UnknownLocation TEXT,
    FOREIGN KEY (MaintPlant) REFERENCES Plant(Plant_Code)
        ON UPDATE CASCADE 
        ON DELETE SET NULL,
    FOREIGN KEY (PlanningPlant) REFERENCES Plant(Plant_Code)
        ON UPDATE CASCADE 
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Location (
    Location_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Location_Name TEXT UNIQUE,
    FOREIGN KEY (Location_Name) REFERENCES TurbineData(FunctionalLoc)
        ON UPDATE CASCADE 
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Technician (
    Technician_ID INT PRIMARY KEY,
    Name VARCHAR(100),
    Surname VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS FaultReport (
    Report_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Technician_ID INT,
    TurbineLocation INTEGER,
    Report_Date DATE,
    Fault_Type TEXT DEFAULT 'Replacement Part',
    Material_ID INTEGER,
    Report_Status VARCHAR(50),
    Updated_Time TIMESTAMP,
    Attachment BLOB,
    FOREIGN KEY (Technician_ID) REFERENCES Technician(Technician_ID),
    FOREIGN KEY (TurbineLocation) REFERENCES Location(Location_ID)
);

CREATE TABLE IF NOT EXISTS TurbineMaintenanceLog (
    Log_ID INT PRIMARY KEY,
    TurbineLocation INT,
    Maintenance_Date DATE,
    Fault_Description TEXT,
    Updated_Time TIMESTAMP,
    Technician_ID INT,
    Report_ID INT,
    FOREIGN KEY (TurbineLocation) REFERENCES Location(Location_ID),
    FOREIGN KEY (Technician_ID) REFERENCES Technician(Technician_ID),
    FOREIGN KEY (Report_ID) REFERENCES FaultReport(Report_ID)
);

CREATE TABLE IF NOT EXISTS BatchManagement (
    Batch_ID INT PRIMARY KEY,
    Batch_Number VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS SerialNumberProfile (
    Material_ID INT PRIMARY KEY,
    Tracking_Number VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS Material (
    Material_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Material_A9B_Number TEXT UNIQUE,
    MaterialCategory TEXT,
    Material_Description TEXT,
    Is_Batch_Managed BOOLEAN,
    Future_Replacement_Probability REAL,
    TotalReplacementCount INTEGER,
    TotalUsageCount INTEGER
);

CREATE TABLE IF NOT EXISTS Deliveries (
    Delivery_ID INT PRIMARY KEY,
    Supplier_ID INT,
    Delivery_Date DATE,
    BatchManagement_ID INT,
    Delivery_Status VARCHAR(50),
    SerialNumberProfile_ID INT,
    FOREIGN KEY (BatchManagement_ID) REFERENCES BatchManagement(Batch_ID),
    FOREIGN KEY (SerialNumberProfile_ID) REFERENCES SerialNumberProfile(Material_ID)
);

CREATE TABLE IF NOT EXISTS ReplacementPart (
    ReplacementPart_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Material_ID INTEGER,
    Plant_ID INTEGER,
    ReplacementDate DATE,
    ReplacementReason TEXT DEFAULT 'Replacement Part',
    Technician_ID INTEGER,
    Timestamp DATETIME,
    FOREIGN KEY (Material_ID) REFERENCES Material(Material_ID),
    FOREIGN KEY (Plant_ID) REFERENCES Plant(Plant_ID),
    FOREIGN KEY (Technician_ID) REFERENCES Technician(Technician_ID),
    UNIQUE(Material_ID, Plant_ID)
);

CREATE TABLE IF NOT EXISTS SCADA (
    SCADA_ID INT PRIMARY KEY,
    TurbineLocation INT,
    Monitor_Date DATE,
    SCADA_Reading FLOAT,
    SCADA_Status VARCHAR(50),
    SCADA_Message TEXT,
    FOREIGN KEY (TurbineLocation) REFERENCES Location(Location_ID)
);

CREATE TABLE IF NOT EXISTS Plant (
    Plant_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Plant_Name TEXT UNIQUE,
    Plant_Latitude REAL,
    Plant_Longitude REAL,
    SerialNumberProfile_ID INT,
    Defaulted BOOLEAN DEFAULT 0,
    IsPlant BOOLEAN DEFAULT 0,
    IsPlanningPlant BOOLEAN DEFAULT 0,
    IsManufacturingPlant BOOLEAN DEFAULT 0,
    ReplacementRiskLevel TEXT,
    FOREIGN KEY (SerialNumberProfile_ID) REFERENCES SerialNumberProfile(Material_ID)
);

CREATE TABLE IF NOT EXISTS DemandForecastingData (
    Forecast_ID INT PRIMARY KEY,
    TurbineLocation INT,
    Forecast_Date DATE,
    Forecast_Demand FLOAT,
    FOREIGN KEY (TurbineLocation) REFERENCES Location(Location_ID)
);

CREATE TABLE IF NOT EXISTS ReplacementPrediction (
    Prediction_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Material_ID INTEGER,
    Material_Description TEXT,
    Plant_ID INTEGER DEFAULT -1,
    MaterialCategory TEXT,
    Total_Count INTEGER,
    Count_B INTEGER,
    BayesianProbability REAL,
    MonteCarloProbability REAL,
    MonteCarlo_5thPercentile REAL,
    MonteCarlo_95thPercentile REAL,
    MonteCarlo_StdDev REAL,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Material_ID) REFERENCES Material(Material_ID),
    FOREIGN KEY (Plant_ID) REFERENCES Plant(Plant_ID),
    UNIQUE(Material_ID, Plant_ID, MaterialCategory)
);

CREATE TABLE IF NOT EXISTS ReplacementPredictionGlobal (
    Prediction_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Material_ID INTEGER,
    Material_Description TEXT,
    MaterialCategory TEXT,
    Total_Count INTEGER,
    Count_B INTEGER,
    BayesianProbability REAL,
    MonteCarloProbability REAL,
    MonteCarlo_5thPercentile REAL,
    MonteCarlo_95thPercentile REAL,
    MonteCarlo_StdDev REAL,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(Material_ID, MaterialCategory)
);

CREATE TABLE IF NOT EXISTS MonteCarloDominance (
    Dominance_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Description TEXT UNIQUE,
    DominanceCount INTEGER,
    Percentage REAL,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ReplacementTrends (
    Trend_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Prediction_ID INTEGER,
    Timestamp TEXT,
    Description TEXT,
    Count INTEGER,
    UNIQUE(Timestamp, Description)
);

CREATE TABLE IF NOT EXISTS MaterialCategoryPredictions (
    Category TEXT PRIMARY KEY,
    BayesianProbability REAL,
    MonteCarloEstimate REAL,
    MonteCarlo_5th_Percentile REAL,
    MonteCarlo_50th_Percentile REAL,
    MonteCarlo_95th_Percentile REAL
);

CREATE TABLE IF NOT EXISTS MaterialStatusTransitions (
    Material TEXT,
    Description TEXT,
    PrevStatus TEXT,
    Plant TEXT,
    PlantSpecificMaterialStatus TEXT,
    TransitionCount INTEGER,
    TransitionProbability REAL DEFAULT 0,
    Direction TEXT,
    LastTransitionDate TEXT,
    PRIMARY KEY (Material, PrevStatus, Plant, PlantSpecificMaterialStatus)
);

CREATE TABLE IF NOT EXISTS MaterialCategoryHealthScores (
    CategoryHealthScore_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Category TEXT NOT NULL,
    Plant TEXT NOT NULL,
    HealthScore REAL NOT NULL,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(Category, Plant)
);

CREATE TABLE IF NOT EXISTS MaterialCategoryScoreSummary (
    Category TEXT PRIMARY KEY,
    TotalCategoryScore REAL,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS MaintenanceForecasts (
    Forecast_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Material_ID INTEGER NOT NULL,
    Plant_ID INTEGER NOT NULL,
    LastMaintenance DATE,
    AverageIntervalDays INTEGER,
    NextEstimatedMaintenanceDate DATE,
    UNIQUE(Material_ID, Plant_ID),
    FOREIGN KEY (Material_ID) REFERENCES Material(Material_ID),
    FOREIGN KEY (Plant_ID) REFERENCES Plant(Plant_ID)
);

CREATE TABLE IF NOT EXISTS MaterialComponentHealthScore (
    ComponentHealthScore_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Material_ID TEXT NOT NULL,
    Plant TEXT NOT NULL,
    HealthScore REAL NOT NULL,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(Material_ID, Plant)
);

CREATE TABLE IF NOT EXISTS MaterialComponentScoreSummary (
    Material_ID TEXT PRIMARY KEY,
    TotalComponentScore REAL,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS TurbineModelHealthScore (
    ModelHealthScore_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    TurbineModel TEXT NOT NULL,
    Plant TEXT NOT NULL,
    HealthScore REAL NOT NULL,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(TurbineModel, Plant)
);

CREATE TABLE IF NOT EXISTS TurbineModelScoreSummary (
    TurbineModel TEXT PRIMARY KEY,
    TotalModelScore REAL,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS TurbinePlatformHealthScore (
    PlatformHealthScore_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Platform TEXT NOT NULL,
    Plant TEXT NOT NULL,
    HealthScore REAL NOT NULL,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(Platform, Plant)
);

CREATE TABLE IF NOT EXISTS TurbinePlatformScoreSummary (
    Platform TEXT PRIMARY KEY,
    TotalPlatformScore REAL,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

------------------------------------------------------------------

INSERT INTO Technician (Technician_ID, Name, Surname) VALUES
(1, 'James', 'Foster'),
(2, 'Patricia', 'Jimenez'),
(3, 'David', 'Perry'),
(4, 'Brooke', 'Jackson'),
(5, 'Jack', 'Frazier');


-- Processed Database ---------------------------------------------

DROP TABLE IF EXISTS MaterialData;
DROP TABLE IF EXISTS TurbineData;

CREATE TABLE IF NOT EXISTS MaterialData (
    Material TEXT,
    Plant TEXT,
    Description TEXT,
    PlantSpecificMaterialStatus TEXT,
    BatchManagementPlant TEXT,
    Serial_No_Profile TEXT,
    ReplacementPart TEXT,
    UsedInSBom TEXT,
    ViolationReplacementPart TEXT,
    MaterialCategory TEXT,
    UnknownPlant TEXT,
    Auto_Classified INTEGER DEFAULT 0,
    NewlyDiscovered INTEGER DEFAULT 0,
    Manually_Classified INTEGER DEFAULT 0,
    PRIMARY KEY (Material, Plant)
);

CREATE TABLE IF NOT EXISTS TurbineData (
    FunctionalLoc TEXT PRIMARY KEY,
    Description TEXT,
    MaintPlant TEXT,  -- Must match MaterialData.Plant
    PlanningPlant TEXT,
    Platform TEXT,
    WTShortName TEXT,
    TurbineModel TEXT,
    MkVersion TEXT,
    Revision TEXT,
    NominalPower TEXT,
    OriginalEqManufact TEXT,
    SBOMForTurbine TEXT,
    SCADAName TEXT,
    SCADAParkID TEXT,
    SCADACode TEXT,
    SCADAFunctionalLoc TEXT,
    TechID TEXT UNIQUE,
    Region TEXT,
    Technology TEXT,
    HubHeight TEXT,
    TowerHeight TEXT,
    TurbineClass TEXT,
    TurbineLatitude REAL,
    TurbineLongitude REAL,
    UnknownMaintPlant TEXT,
    UnknownPlanningPlant TEXT,
    UnknownLocation TEXT
);
------------------------------------------------------------------

-- Unprocessed Database ---------------------------------------------

DROP TABLE IF EXISTS MaterialData;
DROP TABLE IF EXISTS TurbineData;


-- Enable foreign key constraints

CREATE TABLE IF NOT EXISTS MaterialData (
    Material TEXT,
    Plant TEXT,
    Description TEXT,
    PlantSpecificMaterialStatus TEXT,
    BatchManagementPlant TEXT,
    Serial_No_Profile TEXT,
    ReplacementPart TEXT,
    UsedInSBom TEXT,
    PRIMARY KEY (Material, Plant)
);

CREATE TABLE IF NOT EXISTS TurbineData (
    FunctionalLoc TEXT PRIMARY KEY,
    Description TEXT,
    MaintPlant TEXT,  -- Must match MaterialData.Plant
    PlanningPlant TEXT,
    Platform TEXT,
    WTShortName TEXT,
    TurbineModel TEXT,
    MkVersion TEXT,
    Revision TEXT,
    NominalPower TEXT,
    OriginalEqManufact TEXT,
    SBOMForTurbine TEXT,
    SCADAName TEXT,
    SCADAParkID TEXT,
    SCADACode TEXT,
    SCADAFunctionalLoc TEXT,
    TechID TEXT UNIQUE,
    Region TEXT,
    Technology TEXT,
    HubHeight TEXT,
    TowerHeight TEXT,
    TurbineClass TEXT,
    TurbineLatitude REAL,
    TurbineLongitude REAL
);

------------------------------------------------------------------

-- Insert the data into the Material Table

INSERT INTO MaterialData (Material, Description, Plant, PlantSpecificMaterialStatus, BatchManagementPlant, Serial_No_Profile, ReplacementPart, UsedInSBom)
VALUES
(5130, 'Other merchandise', 'DKS1', 'Z3', NULL, 'ZPP2', NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '15S1', 'Z5', NULL, 'ZPP2', NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '24S1', 'Z5', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '25S1', 'Z5', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '26S1', 'Z5', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '43S1', 'Z4', NULL, 'ZPP2', NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '51S1', 'Z4', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '53S1', 'Z4', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '54S1', 'Z4', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '50S1', 'Z4', NULL, 'ZPP2', NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', 'HNS1', 'Z4', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', 'DOS1', 'Z7', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', 'HRS3', 'Z7', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', 'HUS1', 'Z8', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', 'INS5', 'Z4', NULL, NULL, NULL, NULL);

INSERT INTO TurbineData (
    FunctionalLoc, Description, MaintPlant, PlanningPlant, Platform, WTShortName, TurbineModel, MkVersion, Revision,
    NominalPower, OriginalEqManufact, SBOMForTurbine, SCADAName, SCADAParkID, SCADACode, SCADAFunctionalLoc,
    TechID, Region, Technology, HubHeight, TowerHeight, TurbineClass, TurbineLatitude, TurbineLongitude 
)
VALUES
-- These have empty lat/lon (for fallback testing)
('AR0001=G001', 'WT T01 ARGENTINA (600766)', '50S1', '50S1', 'G1', 'T01', 'SWT-0.6-44 IT/ES', '', '', '600 KW',
 'Siemens', 'ZZ0005', '', '1.875.338', '', 'AR0001=K001', '600766', 'Latin America', '', '', '', '','', ''),
('AR0001=G002', 'WT T02 ARGENTINA (600767)', '50S1', '50S1', 'G1', 'T02', 'SWT-0.6-44 IT/ES', '', '', '600 KW',
 'Siemens', 'ZZ0005', '', '1.875.338', '', 'AR0001=K001', '600767', 'Latin America', '', '', '', '','', ''),
('AR0002=G001', 'WT T01 PUNTA ALTA (600960)', '50S1', '50S1', 'G1', 'T01', 'SWT-0.6-44', '', '', '600 KW',
 'Siemens', 'ZZ0005', '', '1.875.452', '', 'AR0002=K001', '600960', 'Latin America', '', '', '', '','', ''),
('AR0002=G002', 'WT T02 PUNTA ALTA (600962)', '50S1', '50S1', 'G1', 'T02', 'SWT-0.6-44', '', '', '600 KW',
 'Siemens', 'ZZ0005', '', '1.875.452', '', 'AR0002=K001', '600962', 'Latin America', '', '', '', '','', ''),
('AR0002=G003', 'WT T03 PUNTA ALTA (600961)', '50S1', '50S1', 'G1', 'T03', 'SWT-0.6-44', '', '', '600 KW',
 'Siemens', 'ZZ0005', '', '1.875.452', '', 'AR0002=K001', '600961', 'Latin America', '', '', '', '','', ''),

-- These have converted valid lat/lon (processed)
('AR0003=G001', 'WT Arauco I & II ,AG-70 (61028441)', '50S1', '50S1', 'SG2X', 'AG-70', 'SG 2.1-114', '', '', '2.625 KW',
 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028441', 'Latin America', 'DAC', '80,00 m', '', 'IIA', -2.8914044, -6.6877467),
('AR0003=G002', 'WT Arauco I & II ,AG-71 (61028442)', '50S1', '50S1', 'SG2X', 'AG-71', 'SG 2.1-114', '', '', '2.625 KW',
 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028442', 'Latin America', 'DAC', '80,00 m', '', 'IIA', -2.8914170, -6.6884972),
('AR0003=G003', 'WT Arauco I & II ,AG-72 (61028443)', '50S1', '50S1', 'SG2X', 'AG-72', 'SG 2.1-114', '', '', '2.625 KW',
 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028443', 'Latin America', 'DAC', '80,00 m', '', 'IIA', -2.8914308, -6.6892364),
('AR0003=G004', 'WT Arauco I & II ,AG-73 (61028444)', '50S1', '50S1', 'SG2X', 'AG-73', 'SG 2.1-114', '', '', '2.625 KW',
 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028444', 'Latin America', 'DAC', '80,00 m', '', 'IIA', -2.8914447, -6.6899756),
('AR0003=G005', 'WT Arauco I & II ,AG-74 (61028445)', '50S1', '50S1', 'SG2X', 'AG-74', 'SG 2.1-114', '', '', '2.625 KW',
 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028445', 'Latin America', 'DAC', '80,00 m', '', 'IIA', -2.8914578, -6.6907244),
('AR0003=G006', 'WT Arauco I & II ,AG-75 (61028446)', '50S1', '50S1', 'SG2X', 'AG-75', 'SG 2.1-114', '', '', '2.625 KW',
 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028446', 'Latin America', 'DAC', '80,00 m', '', 'IIA', -2.8914681, -6.6913964),
('AR0003=G007', 'WT Arauco I & II ,AG-77 (61028447)', '50S1', '50S1', 'SG2X', 'AG-77', 'SG 2.1-114', '', '', '2.625 KW',
 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028447', 'Latin America', 'DAC', '80,00 m', '', 'IIA', -2.8914783, -6.6920683),
('AR0003=G008', 'WT Arauco I & II ,AG-88 (61028448)', '50S1', '50S1', 'SG2X', 'AG-88', 'SG 2.1-114', '', '', '2.625 KW',
 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028448', 'Latin America', 'DAC', '80,00 m', '', 'IIA', -2.8914890, -6.6927403),
('AR0003=G009', 'WT Arauco I & II ,AG-89 (61028449)', '50S1', '50S1', 'SG2X', 'AG-89', 'SG 2.1-114', '', '', '2.625 KW',
 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028449', 'Latin America', 'DAC', '80,00 m', '', 'IIA', -2.8914993, -6.6934122),
('AR0003=G010', 'WT Arauco I & II ,AG-90 (61028450)', '50S1', '50S1', 'SG2X', 'AG-90', 'SG 2.1-114', '', '', '2.625 KW',
 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028450', 'Latin America', 'DAC', '80,00 m', '', 'IIA', -2.8915094, -6.6940842);

