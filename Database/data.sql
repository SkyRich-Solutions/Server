-- database: Processed Data.db
DROP TABLE IF EXISTS MaterialData;
DROP TABLE IF EXISTS TurbineData;

CREATE TABLE MaterialData (
    Material INTEGER,
    Plant TEXT UNIQUE,  -- Ensure uniqueness so it can be referenced
    Description TEXT,
    PlantSpecificMaterialStatus TEXT,
    BatchManagementPlant TEXT,
    SerialNoProfile TEXT,
    ReplacementPart TEXT,
    UsedInSBom TEXT,
    PRIMARY KEY (Material, Plant)
);



CREATE TABLE TurbineData (
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
    TurbineLatitude TEXT,
    TurbineLongitude TEXT,
    FOREIGN KEY (MaintPlant) REFERENCES MaterialData(Plant) 
    ON UPDATE CASCADE 
    ON DELETE SET NULL
);

PRAGMA foreign_keys = ON;


-- Testing automatic updtaes
INSERT INTO MaterialData (Material, Plant, Description, PlantSpecificMaterialStatus)
VALUES (50002, '99S1', 'Test Material', 'Z1');

INSERT INTO TurbineData (FunctionalLoc, Description, MaintPlant)
VALUES ('AR0004=G001', 'New WT', '99S1');

UPDATE MaterialData SET Plant = '100S1' WHERE Plant = '99S1';
DELETE FROM MaterialData WHERE Plant = '100S1';



PRAGMA table_info(MaterialData);
PRAGMA table_info(TurbineData);

-- Testing complete



-- Insert the data into the Material Table

INSERT INTO MaterialData (Material, Description, Plant, PlantSpecificMaterialStatus, BatchManagementPlant, SerialNoProfile, ReplacementPart, UsedInSBom)
VALUES
(5130, 'Other merchandise', 'DKS1', 'Z3', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '15S1', 'Z5', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '24S1', 'Z5', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '25S1', 'Z5', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '26S1', 'Z5', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '43S1', 'Z4', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '51S1', 'Z4', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '53S1', 'Z4', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', '54S1', 'Z4', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', 'DOS1', 'Z4', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', 'HNS1', 'Z4', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', 'HRS1', 'Z7', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', 'HRS3', 'Z7', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', 'HUS1', 'Z8', NULL, NULL, NULL, NULL),
(50001, '2P K6 6A S202 CIRCUIT BREAKER', 'INS5', 'Z4', NULL, NULL, NULL, NULL);

-- Insert the data into the Turbine Table

INSERT INTO TurbineData (
    FunctionalLoc, Description, MaintPlant, PlanningPlant, Platform, WTShortName, TurbineModel, MkVersion, Revision, NominalPower, OriginalEqManufact, SBOMForTurbine, SCADAName, SCADAParkID, SCADACode, SCADAFunctionalLoc, TechID, Region, Technology, HubHeight, TowerHeight, TurbineClass, TurbineLatitude, TurbineLongitude
)
VALUES
('AR0001=G001', 'WT T01 ARGENTINA (600766)', '50S1', '50S1', 'G1', 'T01', 'SWT-0.6-44 IT/ES', '', '', '600 KW', 'Siemens', 'ZZ0005', '', '1.875.338', '', 'AR0001=K001', '600766', 'Latin America', '', '', '', '', '', ''),
('AR0001=G002', 'WT T02 ARGENTINA (600767)', '50S1', '50S1', 'G1', 'T02', 'SWT-0.6-44 IT/ES', '', '', '600 KW', 'Siemens', 'ZZ0005', '', '1.875.338', '', 'AR0001=K001', '600767', 'Latin America', '', '', '', '', '', ''),
('AR0002=G001', 'WT T01 PUNTA ALTA (600960)', '50S1', '50S1', 'G1', 'T01', 'SWT-0.6-44', '', '', '600 KW', 'Siemens', 'ZZ0005', '', '1.875.452', '', 'AR0002=K001', '600960', 'Latin America', '', '', '', '', '', ''),
('AR0002=G002', 'WT T02 PUNTA ALTA (600962)', '50S1', '50S1', 'G1', 'T02', 'SWT-0.6-44', '', '', '600 KW', 'Siemens', 'ZZ0005', '', '1.875.452', '', 'AR0002=K001', '600962', 'Latin America', '', '', '', '', '', ''),
('AR0002=G003', 'WT T03 PUNTA ALTA (600961)', '50S1', '50S1', 'G1', 'T03', 'SWT-0.6-44', '', '', '600 KW', 'Siemens', 'ZZ0005', '', '1.875.452', '', 'AR0002=K001', '600961', 'Latin America', '', '', '', '', '', ''),
('AR0003=G001', 'WT Arauco I & II ,AG-70 (61028441)', '50S1', '50S1', 'SG2X', 'AG-70', 'SG 2.1-114', '', '', '2.625 KW', 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028441', 'Latin America', 'DAC', '80,00 m', '', 'IIA', '-2,87,29,056', '-6,67,15,888'),
('AR0003=G002', 'WT Arauco I & II ,AG-71 (61028442)', '50S1', '50S1', 'SG2X', 'AG-71', 'SG 2.1-114', '', '', '2.625 KW', 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028442', 'Latin America', 'DAC', '80,00 m', '', 'IIA', '-2,87,29,101', '-6,67,18,590'),
('AR0003=G003', 'WT Arauco I & II ,AG-72 (61028443)', '50S1', '50S1', 'SG2X', 'AG-72', 'SG 2.1-114', '', '', '2.625 KW', 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028443', 'Latin America', 'DAC', '80,00 m', '', 'IIA', '-2,87,29,147', '-6,67,21,291'),
('AR0003=G004', 'WT Arauco I & II ,AG-73 (61028444)', '50S1', '50S1', 'SG2X', 'AG-73', 'SG 2.1-114', '', '', '2.625 KW', 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028444', 'Latin America', 'DAC', '80,00 m', '', 'IIA', '-2,87,29,193', '-6,67,23,992'),
('AR0003=G005', 'WT Arauco I & II ,AG-74 (61028445)', '50S1', '50S1', 'SG2X', 'AG-74', 'SG 2.1-114', '', '', '2.625 KW', 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028445', 'Latin America', 'DAC', '80,00 m', '', 'IIA', '-2,87,29,238', '-6,67,26,694'),
('AR0003=G006', 'WT Arauco I & II ,AG-75 (61028446)', '50S1', '50S1', 'SG2X', 'AG-75', 'SG 2.1-114', '', '', '2.625 KW', 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028446', 'Latin America', 'DAC', '80,00 m', '', 'IIA', '-2,87,29,277', '-6,67,29,027'),
('AR0003=G007', 'WT Arauco I & II ,AG-77 (61028447)', '50S1', '50S1', 'SG2X', 'AG-77', 'SG 2.1-114', '', '', '2.625 KW', 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028447', 'Latin America', 'DAC', '80,00 m', '', 'IIA', '-2,87,29,316', '-6,67,31,360'),
('AR0003=G008', 'WT Arauco I & II ,AG-88 (61028448)', '50S1', '50S1', 'SG2X', 'AG-88', 'SG 2.1-114', '', '', '2.625 KW', 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028448', 'Latin America', 'DAC', '80,00 m', '', 'IIA', '-2,87,29,356', '-6,67,33,693'),
('AR0003=G009', 'WT Arauco I & II ,AG-89 (61028449)', '50S1', '50S1', 'SG2X', 'AG-89', 'SG 2.1-114', '', '', '2.625 KW', 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028449', 'Latin America', 'DAC', '80,00 m', '', 'IIA', '-2,87,29,395', '-6,67,36,026'),
('AR0003=G010', 'WT Arauco I & II ,AG-90 (61028450)', '50S1', '50S1', 'SG2X', 'AG-90', 'SG 2.1-114', '', '', '2.625 KW', 'Siemens Gamesa', 'ZZ0011', 'ARAUCO', '', 'W1187', '', '61028450', 'Latin America', 'DAC', '80,00 m', '', 'IIA', '-2,87,29,434', '-6,67,38,359');



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

DROP TABLE IF EXISTS MaterialData;
DROP TABLE IF EXISTS TurbineData;

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Create tables

CREATE TABLE MaterialData (
    Material INTEGER,
    Plant TEXT UNIQUE,  -- Ensure uniqueness so it can be referenced
    Description TEXT,
    PlantSpecificMaterialStatus TEXT,
    BatchManagementPlant TEXT,
    SerialNoProfile TEXT,
    ReplacementPart TEXT,
    UsedInSBom TEXT,
    PRIMARY KEY (Material, Plant)
);

CREATE TABLE TurbineData (
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
    TurbineLatitude TEXT,
    TurbineLongitude TEXT,
    FOREIGN KEY (MaintPlant) REFERENCES MaterialData(Plant) 
    ON UPDATE CASCADE 
    ON DELETE SET NULL
);

CREATE TABLE Location (
    Location_ID INT PRIMARY KEY,
    Location_Name TEXT
);

CREATE TABLE Technician (
    Technician_ID INT PRIMARY KEY,
    Name VARCHAR(100),
    Surname VARCHAR(100)
);

CREATE TABLE FaultReport (
    Report_ID INT PRIMARY KEY,
    Technician_ID INT,
    TurbineLocation INT,
    Report_Date DATE,
    Fault_Description TEXT,
    Report_Status VARCHAR(50),
    Updated_Time TIMESTAMP,
    Attachment_ID INT,
    FOREIGN KEY (Technician_ID) REFERENCES Technician(Technician_ID),
    FOREIGN KEY (TurbineLocation) REFERENCES Location(Location_ID),
    FOREIGN KEY (Attachment_ID) REFERENCES Attachment(Attachment_ID)
);

CREATE TABLE Attachment (
    Attachment_ID INT PRIMARY KEY,
    Report_ID INT,
    Attachment_Description TEXT,
    FOREIGN KEY (Report_ID) REFERENCES FaultReport(Report_ID)
);

CREATE TABLE TurbineMaintenanceLog (
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

CREATE TABLE BatchManagement (
    Batch_ID INT PRIMARY KEY,
    Batch_Number VARCHAR(100)
);

CREATE TABLE SerialNumberProfile (
    Material_ID INT PRIMARY KEY,
    Tracking_Number VARCHAR(100)
);

CREATE TABLE Material (
    Material_ID INT PRIMARY KEY,
    Material_Type VARCHAR(100),
    Material_Description TEXT,
    Is_Batch_Managed BOOLEAN
);

CREATE TABLE Deliveries (
    Delivery_ID INT PRIMARY KEY,
    Supplier_ID INT,
    Delivery_Date DATE,
    BatchManagement_ID INT,
    Delivery_Status VARCHAR(50),
    SerialNumberProfile_ID INT,
    FOREIGN KEY (BatchManagement_ID) REFERENCES BatchManagement(Batch_ID),
    FOREIGN KEY (SerialNumberProfile_ID) REFERENCES SerialNumberProfile(Material_ID)
);

CREATE TABLE ReplacementPart (
    ReplacementPart_ID INT PRIMARY KEY,
    Delivery_ID INT,
    Material_ID INT,
    FOREIGN KEY (Delivery_ID) REFERENCES Deliveries(Delivery_ID),
    FOREIGN KEY (Material_ID) REFERENCES Material(Material_ID)
);

CREATE TABLE SCADA (
    SCADA_ID INT PRIMARY KEY,
    TurbineLocation INT,
    Monitor_Date DATE,
    SCADA_Reading FLOAT,
    SCADA_Status VARCHAR(50),
    SCADA_Message TEXT,
    FOREIGN KEY (TurbineLocation) REFERENCES Location(Location_ID)
);

CREATE TABLE Plant (
    Plant_ID INT PRIMARY KEY,
    Plant_Name VARCHAR(100),
    Plant_Location VARCHAR(100),
    SerialNumberProfile_ID INT,
    FOREIGN KEY (SerialNumberProfile_ID) REFERENCES SerialNumberProfile(Material_ID)
);

CREATE TABLE DemandForecastingData (
    Forecast_ID INT PRIMARY KEY,
    TurbineLocation INT,
    Forecast_Date DATE,
    Forecast_Demand FLOAT,
    FOREIGN KEY (TurbineLocation) REFERENCES Location(Location_ID)
);

-- Insert test data

INSERT INTO MaterialData (Material, Plant, Description, PlantSpecificMaterialStatus)
VALUES (50002, '99S1', 'Test Material', 'Z1');

INSERT INTO TurbineData (FunctionalLoc, Description, MaintPlant)
VALUES ('AR0004=G001', 'New WT', '99S1');

UPDATE MaterialData SET Plant = '100S1' WHERE Plant = '99S1';
DELETE FROM MaterialData WHERE Plant = '100S1';

INSERT INTO Location (Location_ID, Location_Name) VALUES (1, 'Site A');

INSERT INTO Technician (Technician_ID, Name, Surname) VALUES (1, 'John', 'Doe');

INSERT INTO FaultReport (Report_ID, Technician_ID, TurbineLocation, Report_Date, Fault_Description, Report_Status)
VALUES (1, 1, 1, '2025-02-26', 'Generator failure', 'Pending');

INSERT INTO Attachment (Attachment_ID, Report_ID, Attachment_Description)
VALUES (1, 1, 'Fault report attachment');

INSERT INTO TurbineMaintenanceLog (Log_ID, TurbineLocation, Maintenance_Date, Fault_Description, Technician_ID, Report_ID)
VALUES (1, 1, '2025-02-26', 'Replaced generator', 1, 1);

INSERT INTO BatchManagement (Batch_ID, Batch_Number) VALUES (1, 'Batch_001');

INSERT INTO SerialNumberProfile (Material_ID, Tracking_Number) VALUES (50001, 'SN_50001');

INSERT INTO Material (Material_ID, Material_Type, Material_Description, Is_Batch_Managed)
VALUES (50001, 'Component', 'Circuit Breaker', 1);

INSERT INTO Deliveries (Delivery_ID, Supplier_ID, Delivery_Date, BatchManagement_ID, Delivery_Status, SerialNumberProfile_ID)
VALUES (1, 1001, '2025-02-26', 1, 'Delivered', 50001);

INSERT INTO ReplacementPart (ReplacementPart_ID, Delivery_ID, Material_ID)
VALUES (1, 1, 50001);

INSERT INTO SCADA (SCADA_ID, TurbineLocation, Monitor_Date, SCADA_Reading, SCADA_Status, SCADA_Message)
VALUES (1, 1, '2025-02-26', 98.5, 'OK', 'No issues detected');

INSERT INTO Plant (Plant_ID, Plant_Name, Plant_Location, SerialNumberProfile_ID)
VALUES (1, 'Wind Farm A', 'Location X', 50001);

INSERT INTO DemandForecastingData (Forecast_ID, TurbineLocation, Forecast_Date, Forecast_Demand)
VALUES (1, 1, '2025-03-01', 3000.0);

-- Verify table structures
PRAGMA table_info(MaterialData);
PRAGMA table_info(TurbineData);
PRAGMA table_info(TurbineMaintenanceLog);
PRAGMA table_info(FaultReport);
PRAGMA table_info(Deliveries);
PRAGMA table_info(Plant);

-- End of script
