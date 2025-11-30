import { ElectricalNode, Connection, SwitchState, ComponentType } from '../types';

export const calculateCircuitState = (
  nodes: ElectricalNode[],
  connections: Connection[],
  switchStates: Record<string, SwitchState>
): { energized: Set<string>, earthed: Set<string> } => {
  
  const adj: Record<string, string[]> = {};
  nodes.forEach(n => adj[n.id] = []);

  connections.forEach(c => {
    adj[c.from].push(c.to);
    adj[c.to].push(c.from);
  });

  const energized = new Set<string>();
  const earthed = new Set<string>();
  
  // Helper: Can we pass from n1 to n2?
  const canTraverse = (fromId: string, toId: string): boolean => {
    const nodeFrom = nodes.find(n => n.id === fromId);
    
    // Check Source (always outputs)
    if (nodeFrom?.type === ComponentType.SOURCE) return true;

    // Check Breaker (2-Position)
    if (nodeFrom?.type === ComponentType.CIRCUIT_BREAKER) {
      if (switchStates[fromId] === SwitchState.OPEN) return false;
    }

    // Check Earth Switch (3-Position Logic)
    if (nodeFrom?.type === ComponentType.EARTH_SWITCH) {
      const state = switchStates[fromId];
      if (state === SwitchState.OPEN) return false; // Disconnected completely
      
      if (state === SwitchState.EARTHED) {
         // EARTHED State:
         // The Switch Hinge (Bottom) is connected to Earth.
         // The Switch Top is Disconnected.
         
         // Logic: We identify "Top" vs "Bottom" by Y coordinate.
         // Bottom (Downstream) > Top (Upstream)
         const nodeTo = nodes.find(n => n.id === toId);
         
         // If we are trying to go to the Upstream (Top) node -> BLOCKED.
         if (nodeTo && nodeTo.y < nodeFrom.y) return false;
         
         // If we are trying to go Downstream (Bottom) -> BLOCKED (Because the blade is horizontal to earth, not connecting top to bottom)
         // Wait, "Service" connects Top to Bottom.
         // "Earthed" connects Bottom to Earth (Horizontal) AND disconnects Top.
         
         // So effectively, physically traversing THROUGH the switch from Top to Bottom or Bottom to Top is IMPOSSIBLE in Earthed state.
         // The node itself (the hinge) is earthed.
         return false; 
      }
      
      // If CLOSED (Service), allow all traversal
    }

    return true;
  };

  // --- 1. Propagate Energy ---
  const qEnergy = nodes.filter(n => n.type === ComponentType.SOURCE).map(n => n.id);
  qEnergy.forEach(id => energized.add(id));
  
  const visitedEnergy = new Set<string>(qEnergy);
  
  while (qEnergy.length > 0) {
    const curr = qEnergy.shift()!;
    const neighbors = adj[curr] || [];
    
    for (const next of neighbors) {
      if (!visitedEnergy.has(next)) {
        // Must be able to exit curr AND enter next
        if (canTraverse(curr, next) && canTraverse(next, curr)) {
          energized.add(next);
          visitedEnergy.add(next);
          qEnergy.push(next);
        }
      }
    }
  }

  // --- 2. Propagate Earth ---
  // Seed: All Earth Switches in EARTHED state INJECT EARTH into their Hinge (Bottom/Downstream).
  // Unlike Energy, the Earth Switch acts as a Source of Earth for its connected Downstream node.
  const qEarth: string[] = [];
  
  nodes
    .filter(n => n.type === ComponentType.EARTH_SWITCH && switchStates[n.id] === SwitchState.EARTHED)
    .forEach(esNode => {
      // The Earth Switch itself is Earthed (at the hinge)
      // But we need to propagate it to the Downstream neighbor.
      // Look at connections for this ES node.
      const neighbors = adj[esNode.id] || [];
      neighbors.forEach(nId => {
        const neighbor = nodes.find(n => n.id === nId);
        // Inject earth ONLY to downstream (Y > ES.y)
        if (neighbor && neighbor.y > esNode.y) {
           earthed.add(esNode.id); // Mark ES itself as earthed (optional for coloring)
           earthed.add(nId);
           qEarth.push(nId);
        }
      });
      // Also mark the ES itself as earthed so it colors Green
      earthed.add(esNode.id);
    });
    
  const visitedEarth = new Set<string>(qEarth);

  while (qEarth.length > 0) {
    const curr = qEarth.shift()!;
    const neighbors = adj[curr] || [];
    
    for (const next of neighbors) {
      if (!visitedEarth.has(next)) {
        // To propagate Earth, we must be electrically connected.
        if (canTraverse(curr, next) && canTraverse(next, curr)) {
          earthed.add(next);
          visitedEarth.add(next);
          qEarth.push(next);
        }
      }
    }
  }

  return { energized, earthed };
};