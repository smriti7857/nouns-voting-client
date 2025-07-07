// src/services/graphql.js
import { GraphQLClient } from 'graphql-request';

export class NounsGraphService {
  constructor(endpoint) {
    this.client = new GraphQLClient(endpoint, {
      timeout: 10000, // 10 second timeout
    });
  }

  // Get proposals with pagination
  async getProposals(first = 20, skip = 0, orderBy = 'createdTimestamp', orderDirection = 'desc') {
    const query = `
      query GetProposals($first: Int!, $skip: Int!, $orderBy: String!, $orderDirection: String!) {
        proposals(
          first: $first
          skip: $skip
          orderBy: $orderBy
          orderDirection: $orderDirection
        ) {
          id
          proposer {
            id
          }
          targets
          values
          signatures
          calldatas
          description
          status
          createdTimestamp
          startBlock
          endBlock
          forVotes
          againstVotes
          abstainVotes
          canceled
          executed
          createdTransactionHash
          executedTransactionHash
          votes {
            id
            support
            votes
            voter {
              id
            }
          }
        }
      }
    `;

    try {
      const variables = { first, skip, orderBy, orderDirection };
      const data = await this.client.request(query, variables);
      return this.formatProposals(data.proposals || []);
    } catch (error) {
      console.error('GraphQL query failed:', error);
      throw new Error('Failed to fetch proposals from Graph');
    }
  }

  // Get single proposal by ID
  async getProposal(proposalId) {
    const query = `
      query GetProposal($id: ID!) {
        proposal(id: $id) {
          id
          proposer {
            id
          }
          targets
          values
          signatures
          calldatas
          description
          status
          createdTimestamp
          startBlock
          endBlock
          forVotes
          againstVotes
          abstainVotes
          canceled
          executed
          createdTransactionHash
          executedTransactionHash
          votes {
            id
            support
            votes
            voter {
              id
            }
            reason
          }
        }
      }
    `;

    try {
      const data = await this.client.request(query, { id: proposalId.toString() });
      if (!data.proposal) return null;
      
      const formatted = this.formatProposals([data.proposal]);
      return formatted[0] || null;
    } catch (error) {
      console.error('GraphQL query failed:', error);
      throw new Error(`Failed to fetch proposal ${proposalId} from Graph`);
    }
  }

  // Get proposals by status
  async getProposalsByStatus(status, first = 20) {
    const query = `
      query GetProposalsByStatus($status: String!, $first: Int!) {
        proposals(
          where: { status: $status }
          first: $first
          orderBy: createdTimestamp
          orderDirection: desc
        ) {
          id
          proposer {
            id
          }
          description
          status
          createdTimestamp
          startBlock
          endBlock
          forVotes
          againstVotes
          abstainVotes
        }
      }
    `;

    try {
      const data = await this.client.request(query, { status: status.toUpperCase(), first });
      return this.formatProposals(data.proposals || []);
    } catch (error) {
      console.error('GraphQL query failed:', error);
      throw new Error(`Failed to fetch ${status} proposals from Graph`);
    }
  }

  // Get votes for a specific proposal
  async getProposalVotes(proposalId, first = 100) {
    const query = `
      query GetProposalVotes($proposalId: ID!, $first: Int!) {
        votes(
          where: { proposal: $proposalId }
          first: $first
          orderBy: blockNumber
          orderDirection: desc
        ) {
          id
          support
          votes
          voter {
            id
          }
          blockNumber
          reason
        }
      }
    `;

    try {
      const data = await this.client.request(query, { proposalId: proposalId.toString(), first });
      return data.votes || [];
    } catch (error) {
      console.error('GraphQL query failed:', error);
      throw new Error(`Failed to fetch votes for proposal ${proposalId}`);
    }
  }

  // Get voting stats for an address
  async getVoterStats(voterAddress) {
    const query = `
      query GetVoterStats($voter: String!) {
        votes(
          where: { voter: $voter }
          orderBy: blockNumber
          orderDirection: desc
        ) {
          id
          support
          votes
          proposal {
            id
            description
          }
          blockNumber
        }
      }
    `;

    try {
      const data = await this.client.request(query, { voter: voterAddress.toLowerCase() });
      return data.votes || [];
    } catch (error) {
      console.error('GraphQL query failed:', error);
      return [];
    }
  }

  // Format proposals from Graph response
  formatProposals(proposals) {
    return proposals.map(proposal => {
      // Extract title from description (first line)
      const description = proposal.description || '';
      const lines = description.split('\n').filter(line => line.trim());
      const title = lines[0] || `Proposal ${proposal.id}`;
      
      return {
        id: parseInt(proposal.id),
        title: title.length > 100 ? title.substring(0, 100) + '...' : title,
        description: description,
        proposer: proposal.proposer?.id || '',
        status: proposal.status?.toLowerCase() || 'unknown',
        createdAt: new Date(parseInt(proposal.createdTimestamp) * 1000),
        startBlock: parseInt(proposal.startBlock || 0),
        endBlock: parseInt(proposal.endBlock || 0),
        forVotes: parseInt(proposal.forVotes || 0),
        againstVotes: parseInt(proposal.againstVotes || 0),
        abstainVotes: parseInt(proposal.abstainVotes || 0),
        canceled: proposal.canceled || false,
        executed: proposal.executed || false,
        totalVotes: (parseInt(proposal.forVotes || 0) + 
                    parseInt(proposal.againstVotes || 0) + 
                    parseInt(proposal.abstainVotes || 0)),
        votes: proposal.votes || [],
        createdTransactionHash: proposal.createdTransactionHash,
        executedTransactionHash: proposal.executedTransactionHash
      };
    });
  }

  // Search proposals by text
  async searchProposals(searchTerm, first = 20) {
    const query = `
      query SearchProposals($searchTerm: String!, $first: Int!) {
        proposals(
          where: { description_contains_nocase: $searchTerm }
          first: $first
          orderBy: createdTimestamp
          orderDirection: desc
        ) {
          id
          description
          status
          createdTimestamp
          forVotes
          againstVotes
          abstainVotes
        }
      }
    `;

    try {
      const data = await this.client.request(query, { searchTerm, first });
      return this.formatProposals(data.proposals || []);
    } catch (error) {
      console.error('Search query failed:', error);
      return [];
    }
  }
}