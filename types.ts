export enum ComponentType {
  BUSBAR = 'BUSBAR',
  CIRCUIT_BREAKER = 'CIRCUIT_BREAKER', // Top Component (2 Pos)
  EARTH_SWITCH = 'EARTH_SWITCH',       // Bottom Component (3 Pos: Service/Open/Earth)
  TRANSFORMER = 'TRANSFORMER',
  SOURCE = 'SOURCE',
  CABLE = 'CABLE',
  LOAD = 'LOAD',
  LINK = 'LINK'
}

export enum SwitchState {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  EARTHED = 'EARTHED'
}

export interface ElectricalNode {
  id: string;
  type: ComponentType;
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  rating?: string;
}

export interface Connection {
  from: string;
  to: string;
}

export interface SimulationState {
  switches: Record<string, SwitchState>;
  energizedNodes: Set<string>;
  earthedNodes: Set<string>;
}

export interface SwitchingStep {
  id: string;
  order: number;
  action: string;
  location: string;
  equipment: string;
  description: string;
  checked: boolean;
}
