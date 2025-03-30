import React from 'react';
import { Settings, User, Database, Map, Shield, Bell } from 'lucide-react';

const SettingsPanel: React.FC = () => {
  return (
    <div className="h-full overflow-auto">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <Settings size={20} className="mr-2 text-blue-400" />
          System Settings
        </h2>
        
        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Settings */}
          <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-750 border-b border-gray-700 flex items-center">
              <User size={18} className="mr-2 text-blue-400" />
              <h3 className="font-medium">User Settings</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  User Name
                </label>
                <input 
                  type="text" 
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="admin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Email
                </label>
                <input 
                  type="email" 
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="admin@spatialest.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Password
                </label>
                <input 
                  type="password" 
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="********"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Role
                </label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Administrator</option>
                  <option>Assessor</option>
                  <option>Viewer</option>
                </select>
              </div>
              
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm">
                Save User Settings
              </button>
            </div>
          </div>
          
          {/* Database Settings */}
          <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-750 border-b border-gray-700 flex items-center">
              <Database size={18} className="mr-2 text-green-400" />
              <h3 className="font-medium">Database Configuration</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Database Type
                </label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>PostgreSQL</option>
                  <option>MySQL</option>
                  <option>SQL Server</option>
                  <option>SQLite</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Host
                </label>
                <input 
                  type="text" 
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="localhost"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Port
                </label>
                <input 
                  type="text" 
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="5432"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Database Name
                </label>
                <input 
                  type="text" 
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="spatialest_data"
                />
              </div>
              
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm">
                Test Connection
              </button>
            </div>
          </div>
          
          {/* Map Settings */}
          <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-750 border-b border-gray-700 flex items-center">
              <Map size={18} className="mr-2 text-purple-400" />
              <h3 className="font-medium">Map Configuration</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Map Service Provider
                </label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>ESRI</option>
                  <option>MapBox</option>
                  <option>Google Maps</option>
                  <option>OpenStreetMap</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  API Key
                </label>
                <input 
                  type="password" 
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="********"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Default Center (Lat, Long)
                </label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Latitude"
                    className="w-1/2 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="47.6062"
                  />
                  <input 
                    type="text" 
                    placeholder="Longitude"
                    className="w-1/2 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="-122.3321"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Default Zoom Level (1-18)
                </label>
                <input 
                  type="number" 
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="12"
                  min="1" 
                  max="18"
                />
              </div>
              
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm">
                Apply Map Settings
              </button>
            </div>
          </div>
          
          {/* System Settings */}
          <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-750 border-b border-gray-700 flex items-center">
              <Shield size={18} className="mr-2 text-red-400" />
              <h3 className="font-medium">System Security</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Two-Factor Authentication</span>
                <label className="inline-flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" value="" className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">SSL Encryption</span>
                <label className="inline-flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" value="" className="sr-only peer" checked />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">IP Restrictions</span>
                <label className="inline-flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" value="" className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Session Timeout (minutes)
                </label>
                <input 
                  type="number" 
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="30"
                  min="5" 
                />
              </div>
              
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm">
                Update Security Settings
              </button>
            </div>
          </div>
          
          {/* Notification Settings */}
          <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-750 border-b border-gray-700 flex items-center">
              <Bell size={18} className="mr-2 text-yellow-400" />
              <h3 className="font-medium">Notification Settings</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Notifications</span>
                <label className="inline-flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" value="" className="sr-only peer" checked />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Push Notifications</span>
                <label className="inline-flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" value="" className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Script Completion Alerts</span>
                <label className="inline-flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" value="" className="sr-only peer" checked />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Model Results Alerts</span>
                <label className="inline-flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" value="" className="sr-only peer" checked />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </label>
              </div>
              
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm">
                Save Notification Settings
              </button>
            </div>
          </div>
          
          {/* System Actions */}
          <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-750 border-b border-gray-700">
              <h3 className="font-medium">System Actions</h3>
            </div>
            <div className="p-4 space-y-2">
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm flex items-center justify-center">
                <span>Backup System</span>
              </button>
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm flex items-center justify-center">
                <span>Clear Cache</span>
              </button>
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm flex items-center justify-center">
                <span>View System Logs</span>
              </button>
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm flex items-center justify-center">
                <span>Check for Updates</span>
              </button>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm flex items-center justify-center mt-4">
                <span>Reset System</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Save Settings Button */}
        <div className="mt-6 flex justify-end">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
            Save All Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
