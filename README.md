Nouns Voting Client
A decentralized governance interface for Nouns DAO. I built this while learning Web3 development to create a truly decentralized alternative to existing governance tools.

Why I Built This
I got interested in Nouns DAO after discovering their daily auctions and governance model. When I tried participating in votes, I realized I was using a regular centralized website for "decentralized" governance. This seemed backwards, so I decided to build an alternative that's actually decentralized and can't be censored or shut down.

What It Does
Browse proposals - View all Nouns DAO proposals with real-time vote counts and status
Vote on proposals - Cast votes on active proposals if you own Nouns
Create proposals - Submit new governance proposals to the DAO
View statistics - Track governance activity and your voting history
Configure endpoints - Set your own RPC providers for maximum control
Everything connects directly to Ethereum mainnet through your wallet.

Tech Stack
React + Tailwind for the frontend with dark theme
Ethers.js for blockchain interactions and smart contract calls
Direct contract queries to Nouns DAO (since The Graph wasn't working)
IPFS hosting for decentralized deployment
ENS domains for censorship-resistant access
Getting Started
bash
git clone https://github.com/yourusername/nouns-voting-client
cd nouns-voting-client
npm install
npm start
Connect MetaMask, switch to Ethereum mainnet, and start exploring proposals.

Key Features
Real Governance Data
Queries proposal data directly from Nouns DAO smart contracts. This is slower than indexed APIs but ensures data accuracy and eliminates third-party dependencies.

User-Controlled Infrastructure
Configure your own RPC endpoints in settings. No reliance on my servers or external services - you control your data sources.

Fully Decentralized
Hosted on IPFS across distributed nodes
Accessible via ENS domains
No central servers to shut down
Open source and forkable
Challenges I Solved
The Graph Protocol Issues: When The Graph endpoints weren't working, I had to learn how to query smart contract data directly. This required understanding how to batch requests and optimize blockchain queries.

IPFS Deployment: Traditional web apps don't work well on IPFS. I had to redesign state management to work without localStorage and handle IPFS routing properly.

Blockchain Performance: Direct contract calls are slow. I implemented request batching, caching, and smart loading strategies to improve user experience.

Web3 UX: Built comprehensive error handling for failed transactions, gas estimation, and network issues that are common in Web3 applications.

Live Demo
Deployed on IPFS: [Your deployment URL here]

What I Learned
This project was my hands-on introduction to Web3 development:

How to interact with smart contracts directly using Ethers.js
Why blockchain queries are slow and how to optimize them
The tradeoffs between performance and decentralization
How IPFS hosting works and its limitations
Web3 UX patterns for handling blockchain delays and errors
The importance of user-controlled infrastructure
Future Improvements
Better mobile wallet integration
Query performance optimizations
Support for additional DAO governance standards
Enhanced proposal creation interface
Contributing
I'm still learning Web3, so contributions and feedback are welcome. Areas where help would be useful:

Smart contract interaction optimization
Mobile Web3 experience improvements
Better error handling patterns
Additional RPC endpoint options

Built for the Nouns community while learning about decentralized governance and Web3 development.

