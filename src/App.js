// src/App.js - Dark Theme with Nouns Branding
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import ProposalExplorer from './components/ProposalExplorer';
import ProposalCreator from './components/ProposalCreator';
import StatsPage from './components/StatsPage';
import SettingsModal from './components/SettingsModal';
import { useWeb3 } from './hooks/useWeb3';

function App() {
  const [activeTab, setActiveTab] = useState('proposals');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Settings state (stored in memory for IPFS compatibility)
  const [settings, setSettings] = useState({
    ethRpcEndpoint: 'https://cloudflare-eth.com',
    graphApiEndpoint: 'https://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph',
    useGraphApi: true,
    autoRefresh: true
  });

  // Web3 integration
  const { 
    provider, 
    signer, 
    account, 
    chainId, 
    isConnected, 
    connectWallet, 
    disconnectWallet,
    error: web3Error 
  } = useWeb3(settings.ethRpcEndpoint);

  const handleSettingsSave = (newSettings) => {
    setSettings(newSettings);
    setIsSettingsOpen(false);
    console.log('Settings updated:', newSettings);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'proposals':
        return (
          <ProposalExplorer
            settings={settings}
            provider={provider}
            signer={signer}
            account={account}
            isConnected={isConnected}
          />
        );
      case 'create':
        return (
          <ProposalCreator
            settings={settings}
            provider={provider}
            signer={signer}
            account={account}
            isConnected={isConnected}
            onConnectWallet={connectWallet}
          />
        );
      case 'stats':
        return (
          <StatsPage
            settings={settings}
            provider={provider}
            account={account}
            isConnected={isConnected}
          />
        );
      default:
        return <ProposalExplorer settings={settings} />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header
        account={account}
        isConnected={isConnected}
        onConnectWallet={connectWallet}
        onDisconnectWallet={disconnectWallet}
        onSettingsClick={() => setIsSettingsOpen(true)}
        chainId={chainId}
        web3Error={web3Error}
      />
      
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <main>
        {renderContent()}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSettingsSave}
      />
      
      {/* Dark Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-12">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center mr-3">
              <span className="text-black font-bold text-sm">⌐◨-◨</span>
            </div>
            <span className="text-white font-semibold">Nouns Voting Client</span>
          </div>
          
          <p className="text-gray-400 text-sm mb-2">
            Decentralized governance interface for the Nouns ecosystem
          </p>
          
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
            <span>Hosted on IPFS</span>
            <span>•</span>
            <span>Powered by Web3</span>
            <span>•</span>
            <a 
              href="https://github.com/your-repo" 
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              Open Source
            </a>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-600">
              Built for the Nouniverse • Censorship Resistant • User Controlled
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;