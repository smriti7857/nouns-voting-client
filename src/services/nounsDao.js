// src/services/nounsDao.js
import { ethers } from 'ethers';
import { NOUNS_CONTRACTS, NOUNS_DAO_ABI, NOUNS_TOKEN_ABI, PROPOSAL_STATES } from '../constants/nouns';

export class NounsDaoService {
  constructor(provider, signer = null) {
    this.provider = provider;
    this.signer = signer;
    
    this.daoContract = new ethers.Contract(
      NOUNS_CONTRACTS.NOUNS_DAO,
      NOUNS_DAO_ABI,
      signer || provider
    );
    
    this.tokenContract = new ethers.Contract(
      NOUNS_CONTRACTS.NOUNS_TOKEN,
      NOUNS_TOKEN_ABI,
      provider
    );
  }

  // Get total number of proposals
  async getProposalCount() {
    try {
      const count = await this.daoContract.proposalCount();
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
        this.daoContract.proposals(proposalId),
        this.daoContract.state(proposalId)
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
  async castVote(proposalId, support, reason = '') {
    if (!this.signer) {
      throw new Error('No signer available - wallet not connected');
    }

    try {
      let tx;
      if (reason) {
        tx = await this.daoContract.castVoteWithReason(proposalId, support, reason);
      } else {
        tx = await this.daoContract.castVote(proposalId, support);
      }
      
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
      const tx = await this.daoContract.propose(
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
      const votes = await this.daoContract.getVotes(address, block);
      return parseFloat(ethers.utils.formatEther(votes));
    } catch (error) {
      console.error('Failed to get voting power:', error);
      return 0;
    }
  }

  // Get Nouns owned by an address
  async getNounsOwned(address) {
    try {
      const balance = await this.tokenContract.balanceOf(address);
      const tokenIds = [];
      
      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenId = await this.tokenContract.tokenOfOwnerByIndex(address, i);
        tokenIds.push(tokenId.toNumber());
      }
      
      return {
        count: balance.toNumber(),
        tokenIds
      };
    } catch (error) {
      console.error('Failed to get Nouns owned:', error);
      return { count: 0, tokenIds: [] };
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