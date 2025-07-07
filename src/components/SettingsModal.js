// src/components/SettingsModal.js
import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Info, Globe, Database } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState(settings);
  const [testingEndpoint, setTestingEndpoint] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings = {
      ethRpcEndpoint: 'https://eth-mainnet.g.alchemy.com/v2/demo',
      graphApiEndpoint: 'https://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph',
      useGraphApi: true,
      autoRefresh: true
    };
    setFormData(defaultSettings);
  };

  const testEndpoint = async (endpoint, type) => {
    setTestingEndpoint(true);
    try {
      if (type === 'rpc') {
        // Test RPC endpoint
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            alert('RPC endpoint is working! Current block: ' + parseInt(data.result, 16));
          } else {
            alert('RPC endpoint responded but with an error');
          }
        } else {
          alert('RPC endpoint test failed');
        }
      } else if (type === 'graph') {
        // Test Graph endpoint
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `{
              proposals(first: 1) {
                id
                description
              }
            }`
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.proposals) {
            alert('Graph endpoint is working! Found ' + data.data.proposals.length + ' proposal(s)');
          } else {
            alert('Graph endpoint responded but with unexpected data');
          }
        } else {
          alert('Graph endpoint test failed');
        }
      }
    } catch (error) {
      alert('Endpoint test failed: ' + error.message);
    } finally {
      setTestingEndpoint(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Decentralized Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Privacy Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Fully Decentralized Configuration</p>
                <p>
                  Your settings are stored locally in your browser session only. 
                  No data is sent to centralized servers. You have complete control 
                  over your RPC and data endpoints for maximum privacy and censorship resistance.
                </p>
              </div>
            </div>
          </div>

          {/* Blockchain Settings */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Blockchain Connection</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ethereum RPC Endpoint
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.ethRpcEndpoint || ''}
                    onChange={(e) => handleChange('ethRpcEndpoint', e.target.value)}
                    className="input-field flex-1"
                    placeholder="https://eth-mainnet.g.alchemy.com/v2/your-key"
                  />
                  <button
                    onClick={() => testEndpoint(formData.ethRpcEndpoint, 'rpc')}
                    disabled={testingEndpoint || !formData.ethRpcEndpoint}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    {testingEndpoint ? '...' : 'Test'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Custom RPC endpoint for blockchain interactions. Use Alchemy, Infura, or your own node.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Graph API Endpoint
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.graphApiEndpoint || ''}
                    onChange={(e) => handleChange('graphApiEndpoint', e.target.value)}
                    className="input-field flex-1"
                    placeholder="https://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph"
                  />
                  <button
                    onClick={() => testEndpoint(formData.graphApiEndpoint, 'graph')}
                    disabled={testingEndpoint || !formData.graphApiEndpoint}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    {testingEndpoint ? '...' : 'Test'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Graph Protocol endpoint for fast proposal queries. Fallback to on-chain if disabled.
                </p>
              </div>
            </div>
          </div>

          {/* Data Source Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Data Source Preferences</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="useGraphApi" className="text-sm font-medium text-gray-700">
                    Use Graph Protocol for proposals
                  </label>
                  <p className="text-sm text-gray-500">
                    Enable for faster queries. Disable to use direct blockchain calls only.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="useGraphApi"
                  checked={formData.useGraphApi || false}
                  onChange={(e) => handleChange('useGraphApi', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="autoRefresh" className="text-sm font-medium text-gray-700">
                    Auto-refresh data
                  </label>
                  <p className="text-sm text-gray-500">
                    Automatically refresh proposal data every few minutes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={formData.autoRefresh || false}
                  onChange={(e) => handleChange('autoRefresh', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>

            {!formData.useGraphApi && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-700">
                    <strong>On-chain fallback mode:</strong> Data will be fetched directly from 
                    the blockchain contracts. This is slower but more reliable if Graph endpoints are unavailable.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Popular Endpoints */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Popular Endpoints</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-700">RPC Providers:</p>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>• Alchemy: https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY</li>
                  <li>• Infura: https://mainnet.infura.io/v3/YOUR_KEY</li>
                  <li>• QuickNode: https://YOUR_ENDPOINT.quiknode.pro/YOUR_KEY/</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-gray-700">Graph Endpoints:</p>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>• Hosted Service: https://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph</li>
                  <li>• Decentralized Network: Contact subgraph owner for URL</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Reset to Defaults
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;