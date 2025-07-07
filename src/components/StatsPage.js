// src/components/StatsPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Vote, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { NounsGraphService } from '../services/graphql';
import { NounsDaoService } from '../services/nounsDao';

const StatsPage = ({ settings, provider, account, isConnected }) => {
  const [stats, setStats] = useState({
    totalProposals: 0,
    activeProposals: 0,
    userVotingPower: 0,
    userNounsCount: 0,
    userVotingHistory: [],
    proposalStatusBreakdown: {},
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      return new NounsDaoService(provider);
    }
    return null;
  }, [provider]);

  // Fetch all stats
  const fetchStats = async (showRefreshIndicator = false) => {
    if (!provider) return;

    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const newStats = { ...stats };

      // Fetch general DAO stats
      if (graphService && settings.useGraphApi) {
        try {
          // Get all proposals for analysis
          const allProposals = await graphService.getProposals(100, 0);
          
          newStats.totalProposals = allProposals.length;
          newStats.activeProposals = allProposals.filter(p => p.status === 'active').length;
          
          // Calculate status breakdown
          const statusBreakdown = {};
          allProposals.forEach(proposal => {
            const status = proposal.status || 'unknown';
            statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
          });
          newStats.proposalStatusBreakdown = statusBreakdown;
          
          // Recent activity (last 10 proposals)
          newStats.recentActivity = allProposals.slice(0, 10);

          // User-specific stats if connected
          if (account && isConnected) {
            const userVotes = await graphService.getVoterStats(account);
            newStats.userVotingHistory = userVotes.slice(0, 10);
          }

        } catch (graphError) {
          console.warn('Graph query failed, using basic on-chain data:', graphError);
          // Fall back to basic on-chain stats
          await fetchBasicStats(newStats);
        }
      } else {
        // Use on-chain data only
        await fetchBasicStats(newStats);
      }

      // User-specific on-chain data
      if (daoService && account && isConnected) {
        try {
          const [votingPower, nounsOwned] = await Promise.all([
            daoService.getVotingPower(account),
            daoService.getNounsOwned(account)
          ]);
          
          newStats.userVotingPower = votingPower;
          newStats.userNounsCount = nounsOwned.count;
        } catch (error) {
          console.error('Failed to fetch user stats:', error);
        }
      }

      setStats(newStats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to load statistics: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch basic stats from on-chain data
  const fetchBasicStats = async (newStats) => {
    if (!daoService) return;

    try {
      const proposalCount = await daoService.getProposalCount();
      newStats.totalProposals = proposalCount;
      
      // Get last few proposals to analyze
      const recentProposals = await daoService.getProposals(
        Math.max(1, proposalCount - 10), 
        proposalCount
      );
      
      newStats.activeProposals = recentProposals.filter(p => p.status === 'Active').length;
      newStats.recentActivity = recentProposals.reverse();
      
      // Status breakdown from recent proposals
      const statusBreakdown = {};
      recentProposals.forEach(proposal => {
        const status = proposal.status?.toLowerCase() || 'unknown';
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      });
      newStats.proposalStatusBreakdown = statusBreakdown;

    } catch (error) {
      console.error('Failed to fetch basic stats:', error);
    }
  };

  // Load stats on mount and when dependencies change
  useEffect(() => {
    fetchStats();
  }, [provider, account, isConnected, settings.useGraphApi, settings.graphApiEndpoint]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Vote className="w-4 h-4 text-green-600" />;
      case 'executed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'defeated':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'canceled':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-green-600';
      case 'executed':
        return 'text-blue-600';
      case 'defeated':
        return 'text-red-600';
      case 'canceled':
        return 'text-gray-600';
      default:
        return 'text-yellow-600';
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-red-800">Error Loading Statistics</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => fetchStats()}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nouns DAO Statistics</h2>
          <p className="text-gray-600 mt-1">
            Governance metrics and voting data
          </p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Proposals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProposals}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Proposals</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeProposals}</p>
            </div>
            <Vote className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Your Voting Power</p>
              <p className="text-2xl font-bold text-purple-600">
                {isConnected ? stats.userVotingPower : '—'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Your Nouns</p>
              <p className="text-2xl font-bold text-orange-600">
                {isConnected ? stats.userNounsCount : '—'}
              </p>
            </div>
            <Users className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Proposal Status Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Proposal Status Breakdown</h3>
        
        {Object.keys(stats.proposalStatusBreakdown).length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.proposalStatusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {getStatusIcon(status)}
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">{status}</p>
                  <p className={`text-lg font-bold ${getStatusColor(status)}`}>{count}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No proposal data available</p>
        )}
      </div>

      {/* User Voting History */}
      {isConnected && stats.userVotingHistory.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Recent Votes</h3>
          
          <div className="space-y-3">
            {stats.userVotingHistory.map((vote, index) => (
              <div key={vote.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {vote.proposal?.description?.split('\n')[0] || `Proposal ${vote.proposal?.id}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    Block #{vote.blockNumber}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">
                    {vote.votes} vote{vote.votes !== 1 ? 's' : ''}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    vote.support === 1 ? 'bg-green-100 text-green-700' :
                    vote.support === 0 ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {vote.support === 1 ? 'For' : vote.support === 0 ? 'Against' : 'Abstain'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Proposals</h3>
        
        {stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.slice(0, 5).map((proposal) => (
              <div key={proposal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getStatusIcon(proposal.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {proposal.title || `Proposal ${proposal.id}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {proposal.totalVotes || (proposal.forVotes + proposal.againstVotes + proposal.abstainVotes)} total votes
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(proposal.status)} bg-current bg-opacity-10`}>
                  {proposal.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent activity available</p>
        )}
      </div>

      {/* Connection Prompt for Non-Connected Users */}
      {!isConnected && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">Connect Your Wallet</p>
              <p className="text-sm text-blue-600">
                Connect your wallet to see your personal voting statistics and Nouns ownership
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Source Info */}
      <div className="card bg-gray-50">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-gray-500" />
          <p className="text-sm text-gray-600">
            Data source: {settings.useGraphApi ? 'The Graph Protocol' : 'Direct blockchain queries'}
            {stats.totalProposals > 0 && ` • Last updated: ${new Date().toLocaleTimeString()}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;