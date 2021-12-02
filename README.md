# Hifi Liquidator JS

This protocol liquidation bot enables anyone running it to detect and liquidate bad debt, ensuring that the protocol always stays solvent and stable.

## Set Up

Install the dependencies:

```bash
$ yarn install
```

Then, create a `.env` file and follow the `.env.example` file to add the requisite environment variables. Now you can
run it or start making changes.

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

## Supported Chains

- [ ] Ethereum Mainnet
- [x] Polygon Mainnet
- [ ] Binance Smart Chain Mainnet
- [ ] Fantom
- [ ] Ethereum Goerli Testnet
- [ ] Ethereum Kovan Testnet
- [x] Ethereum Rinkeby Testnet
- [ ] Ethereum Ropsten Testnet

## License

[LGPL v3](./LICENSE.md) © Mainframe Group Inc.
