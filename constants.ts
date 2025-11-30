import { ElectricalNode, Connection, ComponentType, SwitchState } from './types';

// GRID SYSTEM (CENTERED LAYOUT)
// Center X = 500
// Busbar Width = 700 (Starts 150, Ends 850)
// Feeders at: 200, 350, 500, 650, 800

export const INITIAL_NODES: ElectricalNode[] = [
  // --- SOURCE & INCOMER (Centered Upstream) ---
  { id: 'SRC_ENERGEX', type: ComponentType.SOURCE, label: '11kV SUPPLY', x: 500, y: 40 },
  
  // ISO1 (Main Incomer Breaker)
  { id: 'CB_ISO1', type: ComponentType.CIRCUIT_BREAKER, label: 'ISO1', x: 500, y: 100 },
  // ISO11 (Incomer Earth Switch)
  { id: 'ES_ISO1', type: ComponentType.EARTH_SWITCH, label: 'ISO11', x: 500, y: 150 },

  // --- RING MAIN SW1 BUS ---
  // Centered at 500. Start X = 150. Width = 700.
  { id: 'BUS_SW1', type: ComponentType.BUSBAR, label: 'RING MAIN SW1', x: 150, y: 200, width: 700 },
  
  // --- FEEDERS (Symmetrical Spacing: 150px) ---

  // FEEDER 1: MCB1 (To SW5) - X=200 (Left)
  { id: 'CB_MCB1', type: ComponentType.CIRCUIT_BREAKER, label: 'MCB1', x: 200, y: 260 },
  { id: 'ES_MCB1', type: ComponentType.EARTH_SWITCH, label: 'E-MCB1', x: 200, y: 320 },

  // FEEDER 2: MCB2 (To TF3) - X=350
  { id: 'CB_MCB2', type: ComponentType.CIRCUIT_BREAKER, label: 'MCB2', x: 350, y: 260 },
  { id: 'ES_MCB2', type: ComponentType.EARTH_SWITCH, label: 'E-MCB2', x: 350, y: 320 },

  // FEEDER 3: MCB3 (To TF4) - X=500 (Center)
  { id: 'CB_MCB3', type: ComponentType.CIRCUIT_BREAKER, label: 'MCB3', x: 500, y: 260 },
  { id: 'ES_MCB3', type: ComponentType.EARTH_SWITCH, label: 'E-MCB3', x: 500, y: 320 },

  // FEEDER 4: MCB4 (Spare) - X=650
  { id: 'CB_MCB4', type: ComponentType.CIRCUIT_BREAKER, label: 'MCB4', x: 650, y: 260 },
  { id: 'ES_MCB4', type: ComponentType.EARTH_SWITCH, label: 'E-MCB4', x: 650, y: 320 },

  // FEEDER 5: MCB5 (To SW2) - X=800 (Right)
  { id: 'CB_MCB5', type: ComponentType.CIRCUIT_BREAKER, label: 'MCB5', x: 800, y: 260 },
  { id: 'ES_MCB5', type: ComponentType.EARTH_SWITCH, label: 'E-MCB5', x: 800, y: 320 },


  // --- DOWNSTREAM LOADS ---
  
  // SW5 (Ring Main)
  { id: 'CABLE_SW5', type: ComponentType.CABLE, label: '', x: 200, y: 400 },
  { id: 'LOAD_SW5', type: ComponentType.LOAD, label: 'RM SW5', x: 200, y: 450 },

  // TF3
  { id: 'CABLE_TF3', type: ComponentType.CABLE, label: '', x: 350, y: 400 },
  { id: 'TF3', type: ComponentType.TRANSFORMER, label: 'TF3 750kVA', x: 350, y: 460 },

  // TF4
  { id: 'CABLE_TF4', type: ComponentType.CABLE, label: '', x: 500, y: 400 },
  { id: 'TF4', type: ComponentType.TRANSFORMER, label: 'TF4 750kVA', x: 500, y: 460 },

  // Spare
  { id: 'CABLE_SPARE', type: ComponentType.CABLE, label: '', x: 650, y: 400 },
  { id: 'LOAD_SPARE', type: ComponentType.LOAD, label: '', x: 650, y: 420 },

  // SW2
  { id: 'CABLE_SW2', type: ComponentType.CABLE, label: '', x: 800, y: 400 },
  { id: 'LOAD_SW2', type: ComponentType.LOAD, label: 'RM SW2', x: 800, y: 450 },

];

export const INITIAL_CONNECTIONS: Connection[] = [
  // --- INCOMER ---
  { from: 'SRC_ENERGEX', to: 'CB_ISO1' },
  { from: 'CB_ISO1', to: 'ES_ISO1' },
  { from: 'ES_ISO1', to: 'BUS_SW1' }, // Feeds INTO Busbar Center

  // --- FEEDERS ---
  
  // MCB1 -> SW5
  { from: 'BUS_SW1', to: 'CB_MCB1' },
  { from: 'CB_MCB1', to: 'ES_MCB1' },
  { from: 'ES_MCB1', to: 'CABLE_SW5' },
  { from: 'CABLE_SW5', to: 'LOAD_SW5' },

  // MCB2 -> TF3
  { from: 'BUS_SW1', to: 'CB_MCB2' },
  { from: 'CB_MCB2', to: 'ES_MCB2' },
  { from: 'ES_MCB2', to: 'CABLE_TF3' },
  { from: 'CABLE_TF3', to: 'TF3' },

  // MCB3 -> TF4
  { from: 'BUS_SW1', to: 'CB_MCB3' },
  { from: 'CB_MCB3', to: 'ES_MCB3' },
  { from: 'ES_MCB3', to: 'CABLE_TF4' },
  { from: 'CABLE_TF4', to: 'TF4' },

  // MCB4 -> Spare
  { from: 'BUS_SW1', to: 'CB_MCB4' },
  { from: 'CB_MCB4', to: 'ES_MCB4' },
  { from: 'ES_MCB4', to: 'CABLE_SPARE' },
  { from: 'CABLE_SPARE', to: 'LOAD_SPARE' },

  // MCB5 -> SW2
  { from: 'BUS_SW1', to: 'CB_MCB5' },
  { from: 'CB_MCB5', to: 'ES_MCB5' },
  { from: 'ES_MCB5', to: 'CABLE_SW2' },
  { from: 'CABLE_SW2', to: 'LOAD_SW2' },
];

export const INITIAL_SWITCH_STATES: Record<string, SwitchState> = {
  'CB_ISO1': SwitchState.CLOSED,
  'ES_ISO1': SwitchState.CLOSED, 

  'CB_MCB1': SwitchState.CLOSED,
  'ES_MCB1': SwitchState.CLOSED,

  'CB_MCB2': SwitchState.CLOSED,
  'ES_MCB2': SwitchState.CLOSED,

  'CB_MCB3': SwitchState.CLOSED,
  'ES_MCB3': SwitchState.CLOSED,

  'CB_MCB4': SwitchState.OPEN,
  'ES_MCB4': SwitchState.OPEN, 

  'CB_MCB5': SwitchState.CLOSED,
  'ES_MCB5': SwitchState.CLOSED,
};