import React, { useState } from 'react';
import { Calculator, BarChart2, ArrowRight, PlusCircle, XCircle, Info, Play, Download } from 'lucide-react';

const RegressionPanel: React.FC = () => {
  const [modelType, setModelType] = useState('multiple');
  
  // Sample model data
  const models = [
    { id: 1, name: 'Residential Model A', r2: 0.892, variables: 8, cov: 10.4, samples: 423, lastRun: 'Today, 11:42 AM' },
    { id: 2, name: 'Commercial Properties', r2: 0.815, variables: 6, cov: 12.7, samples: 156, lastRun: 'Yesterday, 2:15 PM' },
    { id: 3, name: 'Agricultural Land', r2: 0.774, variables: 5, cov: 14.2, samples: 98, lastRun: '3 days ago' }
  ];
  
  // Sample variable data for current model
  const modelVariables = [
    { name: 'SQUAREFEET', coefficient: 0.427, tValue: 12.53, pValue: 0.001, correlation: 0.89, included: true },
    { name: 'BEDROOMS', coefficient: 0.183, tValue: 5.27, pValue: 0.003, correlation: 0.62, included: true },
    { name: 'BATHROOMS', coefficient: 0.235, tValue: 6.18, pValue: 0.002, correlation: 0.71, included: true },
    { name: 'YEARBUILT', coefficient: 0.156, tValue: 4.12, pValue: 0.012, correlation: 0.58, included: true },
    { name: 'QUALITY', coefficient: 0.312, tValue: 8.45, pValue: 0.001, correlation: 0.79, included: true },
    { name: 'LOTSIZE', coefficient: 0.208, tValue: 5.91, pValue: 0.002, correlation: 0.67, included: true },
    { name: 'NEIGHBORHOOD', coefficient: 0.145, tValue: 3.82, pValue: 0.021, correlation: 0.54, included: true },
    { name: 'GARAGE', coefficient: 0.094, tValue: 2.53, pValue: 0.047, correlation: 0.42, included: true },
    { name: 'POOL', coefficient: 0.075, tValue: 1.89, pValue: 0.089, correlation: 0.35, included: false },
    { name: 'FIREPLACE', coefficient: 0.062, tValue: 1.72, pValue: 0.102, correlation: 0.31, included: false }
  ];
  
  // Chart data for residuals
  const residualData = {
    labels: ['Under -15%', '-15% to -10%', '-10% to -5%', '-5% to 0%', '0% to 5%', '5% to 10%', '10% to 15%', 'Over 15%'],
    values: [3, 8, 15, 25, 23, 17, 7, 2]
  };

  return (
    <div className="h-full flex">
      {/* Model Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 flex flex-col">
        <h2 className="font-bold text-lg mb-4 flex items-center">
          <Calculator size={18} className="mr-2 text-blue-500" />
          Regression Models
        </h2>
        
        <div className="mb-4">
          <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="multiple">Multiple Regression</option>
            <option value="linear">Linear Regression</option>
            <option value="quantile">Quantile Regression</option>
          </select>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {models.map((model, index) => (
            <div 
              key={model.id}
              className={`bg-gray-750 border border-gray-700 rounded-lg mb-3 overflow-hidden ${index === 0 ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                <span className="font-medium">{model.name}</span>
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
              </div>
              <div className="p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">R² Value:</span>
                  <span>{model.r2}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Variables:</span>
                  <span>{model.variables}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">COV:</span>
                  <span>{model.cov}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Samples:</span>
                  <span>{model.samples}</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">Last run: {model.lastRun}</div>
              </div>
            </div>
          ))}
          
          <button className="w-full mt-2 text-center px-3 py-2 rounded border border-dashed border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white text-sm flex items-center justify-center">
            <PlusCircle size={16} className="mr-1" />
            Create New Model
          </button>
        </div>
      </div>
      
      {/* Model Content */}
      <div className="flex-1 flex flex-col">
        {/* Model Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center">
              <BarChart2 size={20} className="mr-2 text-blue-400" />
              Residential Model A
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Multiple regression model with 8 variables | R² = 0.892
            </p>
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-1.5 rounded flex items-center space-x-1 bg-blue-600 text-white hover:bg-blue-700">
              <Play size={16} className="mr-1" />
              <span>Run Model</span>
            </button>
            <button className="px-4 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center">
              <Download size={16} className="mr-1" />
              <span>Export</span>
            </button>
          </div>
        </div>
        
        {/* Model Details */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-xl shadow-md border border-gray-700">
              <h3 className="font-medium mb-2 flex items-center">
                <BarChart2 size={16} className="mr-2 text-purple-400" />
                Model Statistics
              </h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">R²:</span>
                  <span className="font-medium">0.892</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Adjusted R²:</span>
                  <span className="font-medium">0.887</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">F-Statistic:</span>
                  <span className="font-medium">145.23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Prob (F-Statistic):</span>
                  <span className="font-medium">0.00001</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">COV:</span>
                  <span className="font-medium">10.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">PRD:</span>
                  <span className="font-medium">1.02</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-xl shadow-md border border-gray-700">
              <h3 className="font-medium mb-2 flex items-center">
                <Info size={16} className="mr-2 text-blue-400" />
                Model Properties
              </h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Dependent Variable:</span>
                  <span className="font-medium">SALEPRICE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Number of Variables:</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sample Size:</span>
                  <span className="font-medium">423</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Property Type:</span>
                  <span className="font-medium">Residential</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date Range:</span>
                  <span className="font-medium">Jan 2023 - Jun 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Confidence Level:</span>
                  <span className="font-medium">95%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-xl shadow-md border border-gray-700">
              <h3 className="font-medium mb-2">Residual Distribution</h3>
              <div className="h-36 flex items-end space-x-1">
                {residualData.values.map((value, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="bg-blue-500 w-full rounded-t"
                      style={{ height: `${(value / Math.max(...residualData.values)) * 100}%` }}
                    ></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Under -15%</span>
                <span>0%</span>
                <span>Over 15%</span>
              </div>
            </div>
          </div>
          
          {/* Variables Table */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-medium">Model Variables</h3>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
                <PlusCircle size={14} className="mr-1" />
                Add Variable
              </button>
            </div>
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-750">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Variable</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Coefficient</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">t-Value</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">p-Value</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Correlation</th>
                  <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Include</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {modelVariables.map((variable, index) => (
                  <tr key={variable.name} className={index % 2 === 1 ? 'bg-gray-750 bg-opacity-50' : ''}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{variable.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{variable.coefficient}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{variable.tValue}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <span className={variable.pValue < 0.05 ? 'text-green-500' : 'text-yellow-500'}>
                        {variable.pValue}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{variable.correlation}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500 rounded"
                        defaultChecked={variable.included}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegressionPanel;
