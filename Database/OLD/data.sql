
DROP TABLE MaterialData;

DROP TABLE TurbineData;

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