graph TD
    %% External Inputs
    subgraph "External Inputs"
        VehicleSensors[Vehicle Telemetry Stream]
        DriverCam[Driver Camera Stream]
        MaintDB[(Historical Maintenance Logs)]
    end

    %% Security Layer
    subgraph "Security Layer (UEBA)"
        UEBA_Watchdog[UEBA Watchdog Agent]
    end

    %% Orchestration Layer
    subgraph "Orchestration Layer"
        MasterAgent[Master Agent]
    end

    %% Worker Agents
    subgraph "Worker Agent Layer"
        DataAgent[Data Analysis Agent]
        SafetyAgent[Safety Agent]
        DiagAgent[Diagnosis Agent]
        EngageAgent[Customer Engagement Agent]
        SchedAgent[Scheduling Agent]
        RCAAgent[RCA Quality Agent]
    end

    %% User Interface
    subgraph "Frontend Interface"
        Dashboard[Fleet Control Dashboard]
        OwnerApp[Owner Chatbot]
        SecurityPanel[Security Alert Console]
    end

    %% Data Flow
    VehicleSensors --> DataAgent
    DriverCam --> SafetyAgent
    
    DataAgent -->|Anomaly Detected| MasterAgent
    SafetyAgent -->|CRITICAL Alert| MasterAgent
    
    MasterAgent -->|Diagnose| DiagAgent
    MasterAgent -->|Contact Owner| EngageAgent
    MasterAgent -->|Book Slot| SchedAgent
    
    DiagAgent --- MaintDB
    DiagAgent -->|Failure Insights| RCAAgent
    
    EngageAgent --- OwnerApp
    SchedAgent --> Dashboard

    %% Security Flow
    UEBA_Watchdog -.->|Inspects| MasterAgent
    UEBA_Watchdog -.->|Inspects| SchedAgent
    UEBA_Watchdog -.->|Inspects| DataAgent
    UEBA_Watchdog -->|Blocks Access| SecurityPanel
