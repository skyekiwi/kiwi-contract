import 'zx/globals'

import { Keyring } from '@polkadot/keyring'
import { Call, Calls, buildCalls, baseDecode } from '@skyekiwi/s-contract';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { cryptoWaitReady, blake2AsU8a } from '@polkadot/util-crypto';

import chalk from 'chalk';

import { u8aToHex, stringToU8a, sendTx } from '@skyekiwi/util';
import { IPFS } from '@skyekiwi/ipfs';
import fs from 'fs';

import scriptConfig from './config.mjs';
import { config } from 'dotenv'
config();

const main = async () => {

    await cryptoWaitReady();
    $`yarn contract:test`;
    $`yarn contract:compile`;

    // upload the souce code to IPFS
    const wasmBlob = fs.readFileSync('./contract/res/status_message.wasm');
    const cid = await IPFS.add(u8aToHex(wasmBlob));
    
    console.log("WASM Bytes Uploaded", chalk.yellow(cid.cid.toString()));

    const wsProvider = new WsProvider(scriptConfig.rpcEndpoint);
    const api = await ApiPromise.create({provider: wsProvider});

    const seed = process.env.SEED;
    if (!seed) {
        throw new Error("seed phrase not found. Please add an .env file to inject the seed")
    }
    const keypair = new Keyring({
        type: 'sr25519'
    }).addFromUri(seed);

    console.log("Your on-chain address is", chalk.yellow(keypair.address));


    const CONTRACT_NAME = scriptConfig.contractName;
    const initialCalls = new Calls({
        ops: [
            new Call({
                origin_public_key: keypair.publicKey,
                receipt_public_key: blake2AsU8a(CONTRACT_NAME),
                encrypted_egress: false,
    
                transaction_action: 2,
                contract_name: stringToU8a(CONTRACT_NAME),
                amount: null,
                method: stringToU8a('set_status'),
                args: stringToU8a(JSON.stringify({message: "I'm a message"})),
              }),
        ],

        block_number: 0,
        shard_id: 0,
    });
    const encodedCall = '0x' + u8aToHex(new Uint8Array(baseDecode( buildCalls(initialCalls) ))) ;

    const deploymentCall = api.tx.sContract.registerContract(
        CONTRACT_NAME, cid.cid.toString(), encodedCall, 0
    );

    await sendTx(deploymentCall, keypair, true);
}

main()
    .catch(err => {
        console.error(err);
    })
    .finally(() => {
        process.exit(0)
    })