import React, { useState } from 'react';
import { SwitchingStep } from '../types';

interface SwitchingSheetProps {
  steps: SwitchingStep[];
  setSteps: React.Dispatch<React.SetStateAction<SwitchingStep[]>>;
}

const SwitchingSheet: React.FC<SwitchingSheetProps> = ({ steps, setSteps }) => {
  const [newStep, setNewStep] = useState<Partial<SwitchingStep>>({
    action: '',
    location: '',
    equipment: '',
    description: ''
  });

  const handleAddStep = () => {
    if (!newStep.action) return;
    
    setSteps(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        order: prev.length + 1,
        action: newStep.action || '',
        location: newStep.location || '',
        equipment: newStep.equipment || '',
        description: newStep.description || '',
        checked: false
      }
    ]);
    
    setNewStep({ action: '', location: '', equipment: '', description: '' });
  };

  const toggleCheck = (id: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
  };

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="bg-white rounded-none md:rounded-lg md:shadow h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800">Switching Sheet</h2>
        <p className="text-sm text-gray-500">Record your isolation and earthing steps.</p>
      </div>

      <div className="flex-1 overflow-auto p-2 md:p-4 bg-gray-50 md:bg-white">
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[600px]">
                <thead className="bg-gray-100 text-gray-600 font-medium border-b border-gray-200">
                    <tr>
                    <th className="p-2 w-10">#</th>
                    <th className="p-2">Action</th>
                    <th className="p-2">Location</th>
                    <th className="p-2">Equipment</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Checks</th>
                    <th className="p-2 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {steps.map((step) => (
                    <tr key={step.id} className="hover:bg-gray-50 group">
                        <td className="p-2 text-gray-500">{step.order}</td>
                        <td className="p-2 font-medium text-blue-700">{step.action}</td>
                        <td className="p-2">{step.location}</td>
                        <td className="p-2">{step.equipment}</td>
                        <td className="p-2 text-gray-600 truncate max-w-[150px]" title={step.description}>{step.description}</td>
                        <td className="p-2">
                        <input 
                            type="checkbox" 
                            checked={step.checked} 
                            onChange={() => toggleCheck(step.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        </td>
                        <td className="p-2">
                        <button 
                            onClick={() => removeStep(step.id)}
                            className="text-red-400 hover:text-red-600 md:opacity-0 group-hover:opacity-100 transition-opacity font-bold text-lg"
                        >
                            ×
                        </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            
            {steps.length === 0 && (
            <div className="text-center py-8 text-gray-400 italic">No steps recorded. Add one below.</div>
            )}
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
          <input 
            className="p-2 border border-gray-400 rounded text-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Action (e.g. Open)"
            value={newStep.action}
            onChange={e => setNewStep({...newStep, action: e.target.value})}
          />
          <input 
            className="p-2 border border-gray-400 rounded text-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Location"
            value={newStep.location}
            onChange={e => setNewStep({...newStep, location: e.target.value})}
          />
          <input 
            className="p-2 border border-gray-400 rounded text-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Equipment"
            value={newStep.equipment}
            onChange={e => setNewStep({...newStep, equipment: e.target.value})}
          />
          <input 
            className="p-2 border border-gray-400 rounded text-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
            placeholder="Description / Remarks"
            value={newStep.description}
            onChange={e => setNewStep({...newStep, description: e.target.value})}
          />
        </div>
        <button 
          onClick={handleAddStep}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 md:py-2 rounded transition-colors shadow-sm active:bg-blue-800"
        >
          Add Switching Step
        </button>
      </div>
    </div>
  );
};

export default SwitchingSheet;