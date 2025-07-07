// src/components/ProposalExplorer.js - Clean version without demo data
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  ExternalLink,
  User,
  TrendingUp,
  Vote,
  Eye,
  Calendar,
  Activity
} from 'lucide-react';
import { NounsGraphService } from '../services/graphql';
import { NounsDaoService } from '../services/nounsDao';
import { VOTE_TYPES } from '../constants/nouns';

const ProposalExplorer = ({ settings, provider, signer, account, isConnected }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [votingStates, setVotingStates] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Initialize services
  const graphService = useMemo(() => {
    if (settings.useGraphApi && settings.graphApiEndpoint) {
      return new NounsGraphService(settings.graphApiEndpoint);
    }
    return null;
  }, [settings.useGraphApi, settings.graphApiEndpoint]);

  const daoService = useMemo(() => {
    if (provider) {
      return new NounsDaoService(provider, signer);
    }
    return null;
  }, [provider, signer]);

  // Calculate quick stats
  const quickStats = useMemo(() => {
    const active = proposals.filter(p => p.status === 'active').length;
    const total = proposals.length;
    const totalVotes = proposals.reduce((sum, p) => sum + (p.totalVotes || 0), 0);
    
    return { active, total, totalVotes };
  }, [proposals]);

  // Fetch proposals from real data sources only
  const fetchProposals = async (showRefreshIndicator = false) => {
    if (!provider) return;

    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      let fetchedProposals = [];

      // Try Graph API first if enabled
      if (graphService && settings.useGraphApi) {
        try {
          fetchedProposals = await graphService.getProposals(50, 0);
          
          // Add time calculations if we have DAO service
          if (daoService && fetchedProposals.length > 0) {
            const proposalsWithTime = await Promise.all(
              fetchedProposals.map(async (proposal) => {
                try {
                  const timeLeft = await daoService.getTimeUntilEnd(proposal.endBlock);
                  return { ...proposal, timeLeft };
                } catch {
                  return proposal;
                }
              })
            );
            fetchedProposals = proposalsWithTime;
          }
          
          if (fetchedProposals.length > 0) {
            setProposals(fetchedProposals);
            return;
          }
        } catch (graphError) {
          console.warn('Graph query failed, falling back to on-chain:', graphError);
        }
      }

      // Fallback to on-chain data
      if (daoService) {
        try {
          fetchedProposals = await fetchOnChainProposals();
          setProposals(fetchedProposals);
        } catch (onChainError) {
          console.error('On-chain query also failed:', onChainError);
          setError('Failed to load proposals from both Graph API and blockchain. Please check your RPC endpoint configuration.');
        }
      } else {
        setError('No Web3 provider available. Please connect to Ethereum network.');
      }

    } catch (err) {
      console.error('Failed to fetch proposals:', err);
      setError('Failed to load proposals: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOnChainProposals = async () => {
    if (!daoService) throw new Error('DAO service not available');

    const proposalCount = await daoService.getProposalCount();
    const startId = Math.max(1, proposalCount - 20); // Get last 20 proposals
    
    const proposals = await daoService.getProposals(startId, proposalCount);
    
    // Add time calculations and enhanced data
    const enhancedProposals = await Promise.all(
      proposals.map(async (proposal) => {
        const timeLeft = await daoService.getTimeUntilEnd(proposal.endBlock);
        return {
          ...proposal,
          title: `Proposal ${proposal.id}`,
          description: 'On-chain proposal data',
          timeLeft,
          totalVotes: proposal.forVotes + proposal.againstVotes + proposal.abstainVotes
        };
      })
    );
    
    return enhancedProposals;
  };

  // Handle voting
  const handleVote = async (proposalId, support) => {
    if (!daoService || !isConnected) {
      alert('Please connect your wallet to vote');
      return;
    }

    const voteKey = `${proposalId}-${support}`;
    setVotingStates(prev => ({ ...prev, [voteKey]: true }));

    try {
      const tx = await daoService.castVote(proposalId, support);
      console.log('Vote transaction:', tx.hash);
      alert(`Vote submitted! Transaction: ${tx.hash.slice(0, 10)}...`);
      await tx.wait();
      await fetchProposals(true);
    } catch (error) {
      console.error('Voting failed:', error);
      alert('Voting failed: ' + error.message);
    } finally {
      setVotingStates(prev => ({ ...prev, [voteKey]: false }));
    }
  };

  // Filter and sort proposals
  const filteredProposals = useMemo(() => {
    let filtered = proposals.filter(proposal => {
      const matchesSearch = !searchTerm || 
        proposal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.proposer?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        proposal.status?.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'oldest':
          return (a.createdAt || 0) - (b.createdAt || 0);
        case 'mostVotes':
          return (b.totalVotes || 0) - (a.totalVotes || 0);
        case 'endingSoon':
          return (a.endBlock || 0) - (b.endBlock || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [proposals, searchTerm, statusFilter, sortBy]);

  useEffect(() => {
    fetchProposals();
  }, [provider, settings.useGraphApi, settings.graphApiEndpoint]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-900/20 text-green-300 border-green-500/30';
      case 'pending':
        return 'bg-yellow-900/20 text-yellow-300 border-yellow-500/30';
      case 'queued':
        return 'bg-blue-900/20 text-blue-300 border-blue-500/30';
      case 'executed':
        return 'bg-purple-900/20 text-purple-300 border-purple-500/30';
      case 'defeated':
        return 'bg-red-900/20 text-red-300 border-red-500/30';
      case 'canceled':
        return 'bg-gray-700/20 text-gray-400 border-gray-500/30';
      case 'succeeded':
        return 'bg-emerald-900/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-gray-700/20 text-gray-400 border-gray-500/30';
    }
  };

  const getVoteButtonColor = (support) => {
    switch (support) {
      case VOTE_TYPES.FOR:
        return 'bg-green-600 hover:bg-green-500 text-white border-green-500';
      case VOTE_TYPES.AGAINST:
        return 'bg-red-600 hover:bg-red-500 text-white border-red-500';
      case VOTE_TYPES.ABSTAIN:
        return 'bg-gray-600 hover:bg-gray-500 text-white border-gray-500';
      default:
        return 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500';
    }
  };

  const getVoteButtonText = (support) => {
    switch (support) {
      case VOTE_TYPES.FOR: return 'Vote For';
      case VOTE_TYPES.AGAINST: return 'Vote Against';
      case VOTE_TYPES.ABSTAIN: return 'Abstain';
      default: return 'Vote';
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Nouns DAO Proposals</h2>
          <p className="text-gray-300 mb-2">Fetching the latest governance data...</p>
          <p className="text-sm text-gray-500">
            {settings.useGraphApi ? 'Using The Graph Protocol for fast queries' : 'Using direct blockchain queries'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md mx-4">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-400 mr-3" />
            <h3 className="text-xl font-bold text-red-300">Connection Error</h3>
          </div>
          <p className="text-red-300 mb-6">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={() => fetchProposals()}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="space-y-8 pb-8">
        {/* Hero Section - Dark with Nouns Colors */}
        <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
          {/* Subtle Nouns pattern background */}
          <div className="absolute inset-0 opacity-5">
            <div className="grid grid-cols-8 gap-4 h-full">
              {[...Array(32)].map((_, i) => (
                <div key={i} className="bg-yellow-400 rounded-lg"></div>
              ))}
            </div>
          </div>
          
          <div className="container mx-auto px-4 py-16 relative">
            <div className="max-w-4xl mx-auto text-center">
              {/* Nouns Branding */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center mr-4">
                  <div className="text-black font-bold text-2xl">⌐◨-◨</div>
                </div>
                <div className="text-left">
                  <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    Nouns DAO
                  </h1>
                  <p className="text-gray-400 text-lg">Governance Client</p>
                </div>
              </div>

              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Participate in decentralized decision-making for the Nouns ecosystem. 
                Vote on proposals, fund public goods, and shape the future of Web3.
              </p>
              
              {/* Quick Stats - Dark Theme */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <div className="flex items-center justify-center mb-3">
                    <Vote className="w-6 h-6 mr-2 text-green-400" />
                    <span className="text-3xl font-bold text-white">{quickStats.active}</span>
                  </div>
                  <p className="text-sm text-gray-400">Active Proposals</p>
                </div>
                
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <div className="flex items-center justify-center mb-3">
                    <Activity className="w-6 h-6 mr-2 text-blue-400" />
                    <span className="text-3xl font-bold text-white">{quickStats.total}</span>
                  </div>
                  <p className="text-sm text-gray-400">Total Proposals</p>
                </div>
                
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <div className="flex items-center justify-center mb-3">
                    <TrendingUp className="w-6 h-6 mr-2 text-yellow-400" />
                    <span className="text-3xl font-bold text-white">{quickStats.totalVotes}</span>
                  </div>
                  <p className="text-sm text-gray-400">Total Votes Cast</p>
                </div>
              </div>

              {/* Nouns Info Banner */}
              <div className="mt-8 bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4">
                <p className="text-yellow-300 text-sm">
                  <strong>⌐◨-◨ Nouns DAO:</strong> One Noun auctioned daily forever. Each Noun = 1 vote. 
                  Treasury funds public goods, art, and ecosystem growth.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4">
          {/* Control Header - Dark */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Browse Proposals</h2>
              <p className="text-gray-400 mt-1">
                {filteredProposals.length} proposal{filteredProposals.length !== 1 ? 's' : ''} found
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            </div>
            
            <button
              onClick={() => fetchProposals(true)}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {/* Search and Filter Controls - Dark */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search proposals, proposers, or descriptions..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <select
                    className="pl-10 pr-8 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400 text-white text-sm appearance-none cursor-pointer min-w-[140px]"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="queued">Queued</option>
                    <option value="executed">Executed</option>
                    <option value="succeeded">Succeeded</option>
                    <option value="defeated">Defeated</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>
                
                <select
                  className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400 text-white text-sm cursor-pointer min-w-[140px]"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="mostVotes">Most Votes</option>
                  <option value="endingSoon">Ending Soon</option>
                </select>
              </div>
            </div>
          </div>

          {/* Proposals List - Dark */}
          <div className="space-y-6">
            {filteredProposals.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md mx-auto">
                  <Eye className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">No Proposals Found</h3>
                  <p className="text-gray-400 mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search criteria or filters'
                      : 'No proposals are available from the configured data sources'
                    }
                  </p>
                  {(searchTerm || statusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                      className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-medium"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              filteredProposals.map((proposal) => (
                <div key={proposal.id} className="bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-all duration-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-sm font-medium text-gray-400 bg-gray-800 px-3 py-1 rounded-lg">
                            #{proposal.id}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(proposal.status)}`}>
                            {proposal.status}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                          {proposal.title}
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                          {proposal.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>
                              {proposal.proposer ? 
                                `${proposal.proposer.slice(0, 6)}...${proposal.proposer.slice(-4)}` : 
                                'Unknown'
                              }
                            </span>
                          </div>
                          {proposal.createdAt && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{proposal.createdAt.toLocaleDateString()}</span>
                            </div>
                          )}
                          {proposal.timeLeft && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{proposal.timeLeft}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Voting Stats - Dark Theme */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-500/20">
                        <div className="text-2xl font-bold text-green-400">
                          {proposal.forVotes || 0}
                        </div>
                        <div className="text-sm text-green-300 flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          For
                        </div>
                      </div>
                      <div className="text-center p-4 bg-red-900/20 rounded-lg border border-red-500/20">
                        <div className="text-2xl font-bold text-red-400">
                          {proposal.againstVotes || 0}
                        </div>
                        <div className="text-sm text-red-300 flex items-center justify-center">
                          <XCircle className="w-3 h-3 mr-1" />
                          Against
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-600/20">
                        <div className="text-2xl font-bold text-gray-300">
                          {proposal.abstainVotes || 0}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center justify-center">
                          <Users className="w-3 h-3 mr-1" />
                          Abstain
                        </div>
                      </div>
                      <div className="text-center p-4 bg-blue-900/20 rounded-lg border border-blue-500/20">
                        <div className="text-2xl font-bold text-blue-400">
                          {(proposal.forVotes || 0) + (proposal.againstVotes || 0) + (proposal.abstainVotes || 0)}
                        </div>
                        <div className="text-sm text-blue-300 flex items-center justify-center">
                          <Vote className="w-3 h-3 mr-1" />
                          Total
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Dark */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        {proposal.createdTransactionHash && (
                          <a
                            href={`https://etherscan.io/tx/${proposal.createdTransactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-yellow-400 hover:text-yellow-300 text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>View on Etherscan</span>
                          </a>
                        )}
                      </div>
                      
                      {/* Voting Buttons */}
                      {isConnected && proposal.status?.toLowerCase() === 'active' ? (
                        <div className="flex space-x-2">
                          {[VOTE_TYPES.FOR, VOTE_TYPES.AGAINST, VOTE_TYPES.ABSTAIN].map((support) => {
                            const voteKey = `${proposal.id}-${support}`;
                            const isVoting = votingStates[voteKey];
                            
                            return (
                              <button
                                key={support}
                                onClick={() => handleVote(proposal.id, support)}
                                disabled={isVoting}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border ${getVoteButtonColor(support)}`}
                              >
                                {isVoting ? (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    <span>Voting...</span>
                                  </div>
                                ) : (
                                  getVoteButtonText(support)
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : !isConnected ? (
                        <div className="text-sm text-gray-400 bg-gray-800 px-3 py-2 rounded-lg border border-gray-700">
                          Connect wallet to vote
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 bg-gray-800 px-3 py-2 rounded-lg border border-gray-700">
                          Voting {proposal.status?.toLowerCase() === 'active' ? 'unavailable' : 'closed'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Data Source Footer - Dark */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm text-gray-400">
              <AlertCircle className="w-4 h-4" />
              <span>
                Data from {settings.useGraphApi ? 'The Graph Protocol' : 'Direct blockchain queries'}
                {proposals.length > 0 && ` • Updated ${new Date().toLocaleTimeString()}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalExplorer;