import React from 'react';
import { Database, Search, Filter, Download, UploadCloud, Table } from 'lucide-react';

const DataPanel: React.FC = () => {
  // Define placeholders for the data tables
  const dataSources = [
    { id: 'properties', name: 'Properties', count: 1250, selected: true },
    { id: 'sales', name: 'Sales', count: 523, selected: false },
    { id: 'permits', name: 'Permits', count: 86, selected: false },
    { id: 'landuse', name: 'Land Use', count: 1250, selected: false },
    { id: 'improvements', name: 'Improvements', count: 1124, selected: false }
  ];
  
  // Sample property data
  const propertyData = [
    { id: '10425-01-29', address: '123 Main St', owner: 'Smith, John', value: '$375,000', sqft: 2300, yearBuilt: 2005 },
    { id: '10425-02-13', address: '456 Oak Ave', owner: 'Johnson, Lisa', value: '$425,000', sqft: 3150, yearBuilt: 2010 },
    { id: '10426-05-02', address: '789 Pine Rd', owner: 'Garcia, Maria', value: '$295,000', sqft: 1320, yearBuilt: 1998 },
    { id: '10427-01-15', address: '321 Elm St', owner: 'Taylor, Robert', value: '$512,000', sqft: 4200, yearBuilt: 2015 },
    { id: '10427-03-08', address: '555 Cedar Ln', owner: 'Wilson, Sarah', value: '$335,000', sqft: 1650, yearBuilt: 2002 },
    { id: '10428-07-22', address: '888 Birch Dr', owner: 'Martinez, Carlos', value: '$450,000', sqft: 2800, yearBuilt: 2008 },
    { id: '10429-04-18', address: '222 Maple Ave', owner: 'Anderson, Emily', value: '$385,000', sqft: 2200, yearBuilt: 2007 }
  ];

  return (
    <div className="h-full flex">
      {/* Data Source Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 flex flex-col">
        <h2 className="font-bold text-lg mb-4 flex items-center">
          <Database size={18} className="mr-2 text-blue-500" />
          Data Sources
        </h2>
        
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Search data sources..." 
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-8"
          />
          <Search size={16} className="text-gray-400 absolute left-2.5 top-2.5" />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {dataSources.map(source => (
            <button 
              key={source.id}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm mb-1 ${
                source.selected ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center">
                <Table size={14} className="mr-2" />
                {source.name}
              </span>
              <span className="text-xs text-gray-400">{source.count}</span>
            </button>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded flex items-center justify-center mb-2">
            <UploadCloud size={16} className="mr-1" />
            Import Data
          </button>
          <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded flex items-center justify-center">
            <Download size={16} className="mr-1" />
            Export Data
          </button>
        </div>
      </div>
      
      {/* Data Content */}
      <div className="flex-1 flex flex-col">
        {/* Data Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center">
              <Table size={20} className="mr-2 text-blue-400" />
              Properties Data
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              1,250 records | Last updated: Today, 09:15 AM
            </p>
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search records..." 
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-8"
              />
              <Search size={16} className="text-gray-400 absolute left-2.5 top-2.5" />
            </div>
            <button className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center">
              <Filter size={16} className="mr-1" />
              <span>Filter</span>
            </button>
          </div>
        </div>
        
        {/* Data Table */}
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-750">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Parcel ID</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Address</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Owner</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sq. Ft</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Year Built</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {propertyData.map((property, index) => (
                  <tr key={property.id} className={index % 2 === 1 ? 'bg-gray-750 bg-opacity-50' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{property.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{property.address}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{property.owner}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{property.value}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{property.sqft}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{property.yearBuilt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-400">
              Showing 1 to 7 of 1,250 entries
            </div>
            <div className="flex space-x-1">
              <button className="px-3 py-1 rounded border border-gray-700 text-gray-400 hover:bg-gray-700">Previous</button>
              <button className="px-3 py-1 rounded bg-blue-600 text-white">1</button>
              <button className="px-3 py-1 rounded border border-gray-700 text-gray-400 hover:bg-gray-700">2</button>
              <button className="px-3 py-1 rounded border border-gray-700 text-gray-400 hover:bg-gray-700">3</button>
              <button className="px-3 py-1 rounded border border-gray-700 text-gray-400 hover:bg-gray-700">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPanel;
