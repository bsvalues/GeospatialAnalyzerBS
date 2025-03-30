import React, { useState } from 'react';
import { BarChart2, Table } from 'lucide-react';

interface TableDataItem {
  parcelId: string;
  squareFeet: number;
  sizeRange: string;
}

interface ChartDataItem {
  name: string;
  value: number;
}

interface ResultsPreviewProps {
  tableData: TableDataItem[];
  chartData: ChartDataItem[];
}

const ResultsPreview: React.FC<ResultsPreviewProps> = ({ tableData, chartData }) => {
  const [viewType, setViewType] = useState<'table' | 'chart'>('table');
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <BarChart2 size={16} className="mr-2 text-purple-400" />
          <span className="font-medium">Preview Results</span>
        </div>
        <div>
          <select 
            className="bg-gray-700 border border-gray-600 rounded text-sm px-2 py-1"
            value={viewType}
            onChange={(e) => setViewType(e.target.value as 'table' | 'chart')}
          >
            <option value="table">Table View</option>
            <option value="chart">Chart View</option>
          </select>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {viewType === 'table' ? (
            <div className="bg-gray-750 rounded-lg border border-gray-700 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">PARCEL_ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">SQUAREFEET</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">SIZERANGE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-sm">
                  {tableData.map((row, index) => (
                    <tr key={row.parcelId} className={index % 2 === 1 ? 'bg-gray-750 bg-opacity-50' : ''}>
                      <td className="px-3 py-2">{row.parcelId}</td>
                      <td className="px-3 py-2">{row.squareFeet}</td>
                      <td className="px-3 py-2 text-blue-400">{row.sizeRange}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-2 bg-gray-750 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-medium mb-4">Size Range Distribution</h3>
              <div className="h-40 flex items-end space-x-4 pb-1 px-8">
                {chartData.map((item) => (
                  <div key={item.name} className="flex flex-col items-center w-full">
                    <div 
                      className="bg-blue-500 w-full" 
                      style={{ height: `${(item.value / Math.max(...chartData.map(d => d.value))) * 100}%` }}
                    ></div>
                    <div className="text-xs mt-1">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPreview;
