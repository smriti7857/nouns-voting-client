// src/hooks/useWeb3.js
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export const useWeb3 = (rpcEndpoint) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Initialize provider with custom RPC or default
  useEffect(() => {
    const initProvider = async () => {
      try {
        if (window.ethereum) {
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(web3Provider);
          
          // Check if already connected
          const accounts = await web3Provider.listAccounts();
          if (accounts.length > 0) {
            const network = await web3Provider.getNetwork();
            setAccount(accounts[0]);
            setChainId(network.chainId);
            setIsConnected(true);
            setSigner(web3Provider.getSigner());
          }
        } else {
          // Fallback to RPC provider for read-only operations
          const rpcProvider = new ethers.providers.JsonRpcProvider(rpcEndpoint);
          setProvider(rpcProvider);
        }
      } catch (err) {
        console.error('Failed to initialize provider:', err);
        setError('Failed to initialize Web3 provider');
      }
    };

    initProvider();
  }, [rpcEndpoint]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      setError(null);
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Request account access
      const accounts = await web3Provider.send('eth_requestAccounts', []);
      const network = await web3Provider.getNetwork();
      
      setProvider(web3Provider);
      setSigner(web3Provider.getSigner());
      setAccount(accounts[0]);
      setChainId(network.chainId);
      setIsConnected(true);

      // Set up event listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);

    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError('Failed to connect wallet: ' + err.message);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    // Clean up event listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('disconnect', handleDisconnect);
    }
    
    setSigner(null);
    setAccount('');
    setChainId(null);
    setIsConnected(false);
    setError(null);
    
    // Keep read-only provider for the app to function
    if (rpcEndpoint) {
      const rpcProvider = new ethers.providers.JsonRpcProvider(rpcEndpoint);
      setProvider(rpcProvider);
    }
  }, [rpcEndpoint]);

  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
    }
  }, [account, disconnectWallet]);

  const handleChainChanged = useCallback((chainId) => {
    setChainId(parseInt(chainId, 16));
    // You might want to reload or update the provider here
    window.location.reload();
  }, []);

  const handleDisconnect = useCallback(() => {
    disconnectWallet();
  }, [disconnectWallet]);

  // Switch to Ethereum Mainnet
  const switchToMainnet = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }], // Mainnet
      });
    } catch (err) {
      console.error('Failed to switch network:', err);
      setError('Failed to switch to Ethereum Mainnet');
    }
  }, []);

  return {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    error,
    connectWallet,
    disconnectWallet,
    switchToMainnet
  };
};