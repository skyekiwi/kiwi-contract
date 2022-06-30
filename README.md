# KiwiContract 
Your toolkit for writing secret smart contracts

## Commands

`yarn random-seed`: Generate a random seed and inject it to the .env file. You may use the testnet faucet channel to claim some testnet token.

`yarn contract:compile`: will compile the WASM contract and output the `.wasm` file to `./src/res`

`yarn contract:test`: will run offchain Rust tests on the contract file. 

`yarn chain:create-account`: will instruct the blockchain to create an offchain account for you inside the offchain runtime 

`yarn chain:deploy`: will run `yarn contract:test`, then `yarn contract:compile` and instruct the blockchain to deploy a smart contract inside the enclave. 

`yarn chain:interact`: will send your customized contract call to chain and parse an outcome summary for you.

## Config 

The Config file is located at `./scripts/config.mjs`

`rpcEndpoint`: `ws://127.0.0.1:9944` for local testnet, `wss://staging.rpc.skye.kiwi` for the Alpha Public Testnet of SkyeKiwi
`contractName`: name of the contract

