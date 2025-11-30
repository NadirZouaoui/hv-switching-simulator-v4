import React, { useState, useEffect, useCallback } from 'react';
import SchematicView from './components/SchematicView';
import SwitchingSheet from './components/SwitchingSheet';
import { INITIAL_NODES, INITIAL_CONNECTIONS, INITIAL_SWITCH_STATES } from './constants';
import { calculateCircuitState } from './services/circuitLogic';
import { SwitchState, SwitchingStep, ComponentType } from './types';

const App: React.FC = () => {
  const [switchStates, setSwitchStates] = useState<Record<string, SwitchState>>(INITIAL_SWITCH_STATES);
  const [circuitState, setCircuitState] = useState({
    energizedNodes: new Set<string>(),
    earthedNodes: new Set<string>(),
  });
  const [switchingSteps, setSwitchingSteps] = useState<SwitchingStep[]>([]);
  
  // Mobile View State: 'schematic' or 'sheet'
  const [activeMobileView, setActiveMobileView] = useState<'schematic' | 'sheet'>('schematic');

  useEffect(() => {
    const result = calculateCircuitState(INITIAL_NODES, INITIAL_CONNECTIONS, switchStates);
    setCircuitState({
      energizedNodes: result.energized,
      earthedNodes: result.earthed,
    });
  }, [switchStates]);

  const handleToggleSwitch = useCallback((id: string) => {
    const node = INITIAL_NODES.find(n => n.id === id);
    if (!node) return;

    setSwitchStates(prev => {
      const current = prev[id];
      let next = current;

      if (node.type === ComponentType.CIRCUIT_BREAKER) {
        // 2-Position Toggle
        next = current === SwitchState.CLOSED ? SwitchState.OPEN : SwitchState.CLOSED;
      } else if (node.type === ComponentType.EARTH_SWITCH) {
        // 3-Position Cycle: OPEN -> CLOSED (Service) -> EARTHED -> OPEN
        if (current === SwitchState.OPEN) next = SwitchState.CLOSED;
        else if (current === SwitchState.CLOSED) next = SwitchState.EARTHED;
        else next = SwitchState.OPEN;
      } else {
        next = current === SwitchState.CLOSED ? SwitchState.OPEN : SwitchState.CLOSED;
      }
      
      return { ...prev, [id]: next };
    });
  }, []);

  const handleReset = () => {
    setSwitchStates(INITIAL_SWITCH_STATES);
    setSwitchingSteps([]);
  };

  return (
    <div className="flex flex-col h-screen bg-white font-mono text-black overflow-hidden">
      {/* CAD Header */}
      <header className="bg-gray-900 text-white p-3 shadow flex justify-between items-center border-b-4 border-yellow-500 z-20 shrink-0">
        <div>
          <h1 className="text-sm md:text-lg font-bold tracking-widest uppercase truncate">HV Switching Sim</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Schematic Area - Visible if active view is schematic OR on desktop */}
        <div className={`flex-1 relative border-r border-gray-300 ${activeMobileView === 'schematic' ? 'block' : 'hidden md:block'}`}>
          <SchematicView 
            nodes={INITIAL_NODES}
            connections={INITIAL_CONNECTIONS}
            switchStates={switchStates}
            energizedNodes={circuitState.energizedNodes}
            earthedNodes={circuitState.earthedNodes}
            onToggleSwitch={handleToggleSwitch}
          />

          <button 
            onClick={handleReset} 
            className="absolute top-4 left-4 bg-white border border-gray-400 text-gray-800 hover:bg-red-50 hover:text-red-600 hover:border-red-400 px-3 py-1 text-xs uppercase tracking-wider shadow-sm z-10 transition-colors"
          >
            Reset System
          </button>
        </div>

        {/* Sidebar / Sheet Area - Visible if active view is sheet OR on desktop */}
        <div className={`w-full md:w-[400px] flex flex-col bg-gray-50 border-l border-gray-300 ${activeMobileView === 'sheet' ? 'block h-full' : 'hidden md:flex'}`}>
            <SwitchingSheet 
              steps={switchingSteps} 
              setSteps={setSwitchingSteps} 
            />
        </div>

      </div>

      {/* Mobile Bottom Tab Bar (Visible only on small screens) */}
      <div className="md:hidden bg-gray-900 text-white border-t-2 border-yellow-500 flex shrink-0 z-30">
        <button 
          onClick={() => setActiveMobileView('schematic')}
          className={`flex-1 py-3 text-center text-xs uppercase tracking-widest font-bold ${activeMobileView === 'schematic' ? 'bg-gray-800 text-yellow-500' : 'text-gray-400'}`}
        >
          Schematic
        </button>
        <button 
          onClick={() => setActiveMobileView('sheet')}
          className={`flex-1 py-3 text-center text-xs uppercase tracking-widest font-bold border-l border-gray-700 ${activeMobileView === 'sheet' ? 'bg-gray-800 text-yellow-500' : 'text-gray-400'}`}
        >
          Switching Sheet
        </button>
      </div>
    </div>
  );
};

export default App;