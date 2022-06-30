import 'zx/globals'

import { Keyring } from '@polkadot/keyring'
import { Call, Calls, buildCalls, baseDecode, parseOutcomes } from '@skyekiwi/s-contract';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { cryptoWaitReady, blake2AsU8a } from '@polkadot/util-crypto';

import chalk from 'chalk';

import { u8aToHex, stringToU8a, sleep, sendTx, u8aToString } from '@skyekiwi/util';

import scriptConfig from './config.mjs';
import { config } from 'dotenv'
config();

const main = async () => {

    await cryptoWaitReady();
    
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
    const statusQueryCall = new Calls({
        ops: [
            new Call({
                origin_public_key: keypair.publicKey,
                receipt_public_key: blake2AsU8a(CONTRACT_NAME),
                encrypted_egress: false,
    
                transaction_action: 2,
                contract_name: stringToU8a(CONTRACT_NAME),
                amount: null,
                method: stringToU8a('set_status'),
                args: stringToU8a(JSON.stringify({message: "I'm writing this msg!"})),
            }),
            new Call({
                origin_public_key: keypair.publicKey,
                receipt_public_key: blake2AsU8a(CONTRACT_NAME),
                encrypted_egress: false,
    
                transaction_action: 3,
                contract_name: stringToU8a(CONTRACT_NAME),
                amount: null,
                method: stringToU8a('get_status'),
                args: stringToU8a(JSON.stringify({account_id: u8aToHex(keypair.publicKey)})),
              }),
        ],

        block_number: 0,
        shard_id: 0,
    }); 

    const encodedCall = '0x' + u8aToHex(new Uint8Array(baseDecode( buildCalls(statusQueryCall) ))) ;

    const interactWithContract = api.tx.sContract.pushCall( 0, encodedCall );

    const res = await sendTx(interactWithContract, keypair, true);
    
    let callIndex
    // now let's grab the contract call_index
    for (let event of res) {
        let e = event.toHuman();
        if (e.event.method === 'CallReceived') {
            callIndex = e.event.data[1]
        }
    }

    if (!callIndex) {
        throw new Error("Failed to fetch over the `callIndex`");
    }

    console.log(`The CallIndex of your call is ${chalk.blue(callIndex)}, trying to fetch over the outcome of the call now`);
    console.log(`Now, sleeping for ${chalk.bold('30')} seconds and wait for the result to be populated`);

    await sleep(30_000);

    const result = (await api.query.parentchain.outcome(callIndex)).toHuman();

    const outcomes = parseOutcomes(result);

    console.log(`\n\n======= ${chalk.yellow("OUTCOMES")} =======\n`);

    let opCount = 0;
    for (const op of outcomes.ops) {

        console.log(`==> Outcomes for ${chalk.yellowBright(`OP# ${opCount}`)}`);

        // whether we are talking about a VIEW or CALL
        console.log(`Status(empty == success): "${chalk.red(u8aToString(new Uint8Array(op.outcome_status)))}"`);
        // VIEW
        console.log(`View Result: ${chalk.green(u8aToString(new Uint8Array(op.view_result)))}`);

        console.log(`View Error (if any): ${chalk.red(u8aToString(new Uint8Array(op.view_error)))}`); 

        console.log("")
        opCount ++;
    }
}

main()
    .catch(err => {
        console.error(err);
    })
    .finally(() => {
        process.exit(0)
    })