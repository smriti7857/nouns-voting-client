// src/constants/nouns.js
export const NOUNS_CONTRACTS = {
    NOUNS_DAO: '0x6f3E6272A167e8AcCb32072d08E0957F9c79223d',
    NOUNS_TOKEN: '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03',
    NOUNS_EXECUTOR: '0x0BC3807Ec262cB779b38D65b38158acC3bfedE10'
  };
  
  // Start with simplified ABI to test basic functionality
  export const NOUNS_DAO_ABI = [
    'function proposalCount() external view returns (uint256)',
    'function proposals(uint256 proposalId) external view returns (uint256 id, address proposer, uint256 proposalThreshold, uint256 quorumVotes, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool vetoed, bool executed)',
    'function state(uint256 proposalId) external view returns (uint8)',
    'function castVote(uint256 proposalId, uint8 support) external returns (uint256)',
    'function castVoteWithReason(uint256 proposalId, uint8 support, string calldata reason) external returns (uint256)',
    'function propose(address[] memory targets, uint256[] memory values, string[] memory signatures, bytes[] memory calldatas, string memory description) external returns (uint256)',
    'function getVotes(address account, uint256 blockNumber) external view returns (uint256)'
  ];
  
  export const NOUNS_TOKEN_ABI = [
    'function balanceOf(address owner) external view returns (uint256)',
    'function ownerOf(uint256 tokenId) external view returns (address)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)'
  ];
  
  export const PROPOSAL_STATES = {
    0: 'Pending',
    1: 'Active', 
    2: 'Canceled',
    3: 'Defeated',
    4: 'Succeeded',
    5: 'Queued',
    6: 'Expired',
    7: 'Executed'
  };
  
  export const VOTE_TYPES = {
    AGAINST: 0,
    FOR: 1,
    ABSTAIN: 2
  };
  
  export const GRAPH_ENDPOINTS = {
    NOUNS_SUBGRAPH: 'https://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph',
    NOUNS_SUBGRAPH_BACKUP: 'https://gateway.thegraph.com/api/[api-key]/subgraphs/id/4...'
  };
