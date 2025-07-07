import { ethers } from 'ethers';
import { NOUNS_CONTRACTS, NOUNS_DAO_ABI, PROPOSAL_STATES } from '../constants/nouns';

export class NounsDaoService {
  constructor(provider, signer = null) {
    this.provider = provider;
    this.signer = signer;
    
    this.contract = new ethers.Contract(
      NOUNS_CONTRACTS.NOUNS_DAO,
      NOUNS_DAO_ABI,
      signer || provider
    );
  }

  // Get total number of proposals
  async getProposalCount() {
    try {
      console.log('Testing proposalCount...');
      const count = await this.contract.proposalCount();
      console.log('Raw count:', count);
      return count.toNumber();
    } catch (error) {
      console.error('Failed to get proposal count:', error);
      throw new Error('Failed to fetch proposal count');
    }
  }

  // Get proposal details
  async getProposal(proposalId) {
    try {
      const [proposal, state] = await Promise.all([
        this.contract.proposals(proposalId),
        this.contract.state(proposalId)
      ]);
      
      const currentBlock = await this.provider.getBlockNumber();
      const isActive = state === 1;
      const hasEnded = currentBlock > proposal.endBlock.toNumber();

      return {
        id: proposal.id.toNumber(),
        proposer: proposal.proposer,
        startBlock: proposal.startBlock.toNumber(),
        endBlock: proposal.endBlock.toNumber(),
        forVotes: parseFloat(ethers.utils.formatEther(proposal.forVotes)),
        againstVotes: parseFloat(ethers.utils.formatEther(proposal.againstVotes)),
        abstainVotes: parseFloat(ethers.utils.formatEther(proposal.abstainVotes)),
        canceled: proposal.canceled,
        executed: proposal.executed,
        state: state,
        status: PROPOSAL_STATES[state] || 'Unknown',
        isActive,
        hasEnded,
        currentBlock
      };
    } catch (error) {
      console.error('Failed to get proposal:', error);
      throw new Error(`Failed to fetch proposal ${proposalId}`);
    }
  }

  // Get multiple proposals at once
  async getProposals(startId, endId) {
    try {
      const proposalPromises = [];
      for (let i = startId; i <= endId; i++) {
        proposalPromises.push(this.getProposal(i));
      }
      
      const proposals = await Promise.allSettled(proposalPromises);
      return proposals
        .filter(p => p.status === 'fulfilled')
        .map(p => p.value);
    } catch (error) {
      console.error('Failed to get proposals:', error);
      throw new Error('Failed to fetch proposals');
    }
  }

  // Cast a vote
  async castVote(proposalId, support) {
    if (!this.signer) {
      throw new Error('No signer available - wallet not connected');
    }

    try {
      const tx = await this.contract.castVote(proposalId, support);
      return tx;
    } catch (error) {
      console.error('Failed to cast vote:', error);
      
      // Handle specific error cases
      if (error.code === 4001) {
        throw new Error('Transaction was rejected by user');
      } else if (error.message.includes('already voted')) {
        throw new Error('You have already voted on this proposal');
      } else if (error.message.includes('voting is closed')) {
        throw new Error('Voting period has ended for this proposal');
      } else {
        throw new Error('Failed to cast vote: ' + error.message);
      }
    }
  }

  // Create a new proposal
  async propose(targets, values, signatures, calldatas, description) {
    if (!this.signer) {
      throw new Error('No signer available - wallet not connected');
    }

    try {
      const tx = await this.contract.propose(
        targets,
        values, 
        signatures,
        calldatas,
        description
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to create proposal:', error);
      
      if (error.code === 4001) {
        throw new Error('Transaction was rejected by user');
      } else if (error.message.includes('proposer votes below proposal threshold')) {
        throw new Error('You need at least 1 Noun to create a proposal');
      } else {
        throw new Error('Failed to create proposal: ' + error.message);
      }
    }
  }

  // Get voting power for an address
  async getVotingPower(address, blockNumber = null) {
    try {
      const block = blockNumber || await this.provider.getBlockNumber();
      const votes = await this.contract.getVotes(address, block);
      return parseFloat(ethers.utils.formatEther(votes));
    } catch (error) {
      console.error('Failed to get voting power:', error);
      return 0;
    }
  }

  // Calculate blocks until proposal end
  async getBlocksUntilEnd(endBlock) {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      return Math.max(0, endBlock - currentBlock);
    } catch (error) {
      console.error('Failed to calculate blocks until end:', error);
      return 0;
    }
  }

  // Estimate time until proposal end (assuming ~12 second blocks)
  async getTimeUntilEnd(endBlock) {
    try {
      const blocksLeft = await this.getBlocksUntilEnd(endBlock);
      const secondsLeft = blocksLeft * 12;
      
      if (secondsLeft <= 0) return 'Ended';
      
      const days = Math.floor(secondsLeft / 86400);
      const hours = Math.floor((secondsLeft % 86400) / 3600);
      const minutes = Math.floor((secondsLeft % 3600) / 60);
      
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    } catch (error) {
      console.error('Failed to calculate time until end:', error);
      return 'Unknown';
    }
  }
}
