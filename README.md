# Hifi Liquidator JS

Hifi Liquidator JS is an open-source liquidation bot for the Hifi Finance protocol. It detects and liquidates bad debt, ensuring the solvency and stability of the Hifi protocol. This bot can be run by anyone, and profits generated from liquidations will be sent to the wallet specified in the configuration.

## Introduction

The bot monitors accounts for underwater vaults (where the debt is greater than the collateral) and liquidates them. It also handles liquidation of mature hTokens (hTokens that have reached their maturity date). The bot is written in TypeScript and can be run using Docker, Docker Compose, or Yarn.

## Getting Started

### Prerequisites

- Node.js
- Yarn package manager
- Docker (optional)

### Set Up

1. Clone the repository:

```bash
$ git clone https://github.com/hifi-finance/hifi-liquidator-js.git
$ cd hifi-liquidator-js
```

2. Install the dependencies with Yarn:

```bash
$ yarn install
```

3. Create a .env file and follow the `.env.example` file to add the requisite environment variables. This includes your wallet seed, selected account, API keys, and network information.

## Usage

### Using Docker

```bash
$ docker build ./ -t hififinance/hifi-liquidator-js
$ docker run --env-file .env hififinance/hifi-liquidator-js
```

### Using Docker Compose

```bash
$ docker-compose build
$ docker-compose up
```

### Using Yarn

```bash
$ yarn dev
```

Or

```bash
$ yarn build
$ yarn start
```

## Gotchas

1. Ensure that your wallet has enough funds to cover gas costs and subsidize collateral for liquidations. Additionally, make sure to grant all necessary token approvals for subsidization.
2. Double-check that the `.env` file is set up correctly, as it contains essential information needed for the smooth operation of the bot.
3. Currently, the bot relies on new block information to initiate liquidations, which may put significant strain on API endpoints. Future enhancements could involve reacting to Chainlink price updates and implementing a cooldown period to reduce the load.
4. To optimize API endpoint usage, consider enabling the bot's data persistence feature by setting the `PERSISTENCE` environment variable.

## Supported Chains

- [x] Ethereum Mainnet
- [x] Polygon Mainnet

## License

[LGPL v3](./LICENSE.md) © Mainframe Group Inc.
