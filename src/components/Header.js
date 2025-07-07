// src/components/Header.js - Dark Theme with Nouns Branding
import React from 'react';
import { Settings, Wallet, AlertTriangle, Check } from 'lucide-react';

const Header = ({ 
  account, 
  isConnected, 
  onConnectWallet, 
  onDisconnectWallet, 
  onSettingsClick,
  chainId,
  web3Error
}) => {
  const getNetworkName = (chainId) => {
    switch (chainId) {
      case 1: return 'Mainnet';
      case 5: return 'Goerli';
      case 11155111: return 'Sepolia';
      default: return 'Unknown';
    }
  };

  const isCorrectNetwork = chainId === 1; // Mainnet

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title with Nouns Branding */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              {/* Nouns Glasses Icon */}
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center">
                <span className="text-black font-bold text-lg">⌐◨-◨</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Nouns Voting Client
                </h1>
                <p className="text-xs text-gray-400">Decentralized DAO Interface</p>
              </div>
            </div>
          </div>
          
          {/* Right Side - Network, Wallet, Settings */}
          <div className="flex items-center space-x-4">
            {/* Network Status */}
            {chainId && (
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm border ${
                isCorrectNetwork 
                  ? 'bg-green-900/20 text-green-300 border-green-500/30' 
                  : 'bg-yellow-900/20 text-yellow-300 border-yellow-500/30'
              }`}>
                {isCorrectNetwork ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span>{getNetworkName(chainId)}</span>
              </div>
            )}

            {/* Wallet Connection */}
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-300 font-medium">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={onDisconnectWallet}
                  className="text-sm text-gray-400 hover:text-gray-300 px-2 py-1 rounded transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-all font-medium"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
            
            {/* Settings Button */}
            <button
              onClick={onSettingsClick}
              className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors border border-gray-700"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
        
        {/* Error Banner */}
        {web3Error && (
          <div className="border-t border-red-500/30 bg-red-900/20 px-4 py-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-300">{web3Error}</span>
            </div>
          </div>
        )}
        
        {/* Wrong Network Warning */}
        {isConnected && !isCorrectNetwork && (
          <div className="border-t border-yellow-500/30 bg-yellow-900/20 px-4 py-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-300">
                Please switch to Ethereum Mainnet to interact with Nouns DAO
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 