# Hifi Liquidator JS

Hifi Liquidator JS is an open-source liquidation service for the Hifi Finance protocol. It detects and liquidates bad debt, ensuring the solvency and stability of the Hifi protocol. This service can be run by anyone, and profits generated from liquidations will be sent to the wallet specified in the configuration.

## Introduction

The service monitors accounts for underwater vaults (where the debt is greater than the collateral) and liquidates them. It also handles liquidation of mature hTokens (hTokens that have reached their maturity date). The service is written in TypeScript and can be run using Docker, Docker Compose, or Yarn.

## Getting Started

### Prerequisites

- NVM
- Yarn package manager
- Docker (optional)

### Set Up

1. Clone the repository:

```bash
$ git clone https://github.com/hifi-finance/hifi-liquidator-js.git
$ cd hifi-liquidator-js
```

2. Set the version of Node to use locally within the project:

```bash
$ nvm use
```

3. Install the dependencies with Yarn:

```bash
$ yarn install
```

4. Create a .env file and follow the `.env.example` file to add the requisite environment variables. This includes your wallet seed, selected account, selected liquidation strategy, API keys, and network information.

## Running an Instance

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

### Using Kubernetes

```bash
$ kubectl create configmap hifi-liquidator-js-config-map --from-literal=network-name=homestead --from-literal=persistence=true --from-literal=selected-account=0 --from-literal=silent-mode=false
$ kubectl create secret generic hifi-liquidator-js-secret --from-literal=alchemy-key="<ALCHEMY_KEY>" --from-literal=infura-key="<INFURA_KEY>" --from-literal=wallet-seed="<WALLET_SEED>"
$ kubectl apply -f persistentvolumeclaim.yaml
$ kubectl apply -f deployment.yaml
```

### Using Yarn

```bash
$ yarn start
```

## Upgrading

The service is ran in production on via a Kubernetes cluster. Upgrades can be made as follows:

1. After modifying the source code, update the version in package.json to `NEW_VERSION`.
2. Rebuild the Docker image and push the new version to Docker Hub:

```bash
$ docker build ./ -t hififinance/hifi-liquidator-js
$ docker tag hififinance/hifi-liquidator-js:latest hififinance/hifi-liquidator-js:<NEW_VERSION>
$ docker push hififinance/hifi-liquidator-js:<NEW_VERSION>
```

3. Update the version of the Docker image in deployment.yaml to `NEW_VERSION`.
4. Push all changes to GitHub with the commit message: `build: upgrade package version to NEW_VERSION`.
5. Create a new GitHub release and include description of all changes made in the new version.
6. Pull changes in the Kubernetes cluster and reset persistence and pods to run a fully updated instance:

```bash
$ git pull
$ kubectl apply -f persistentvolumeclaim.yaml
$ kubectl apply -f deployment.yaml
```

## Gotchas

1. Ensure that your wallet has enough funds to cover gas costs and subsidize collateral for liquidations. Additionally, make sure to grant all necessary token approvals for subsidization.
2. Double-check that the `.env` file is set up correctly, as it contains essential information needed for the smooth operation of the bot.
3. Currently, the bot relies on new block information to initiate liquidations, which may put significant strain on API endpoints. Future enhancements could involve reacting to Chainlink price updates and implementing a cooldown period to reduce the load.
4. To optimize API endpoint usage, consider enabling the bot's data persistence feature by setting the `PERSISTENCE_ENABLED` environment variable.

## Supported Chains

- [x] Ethereum Mainnet
- [x] Polygon Mainnet

## License

[LGPL v3](./LICENSE.md) © Mainframe Group Inc.
