import 'zx/globals'

import { Keyring } from '@polkadot/keyring'
import { ApiPromise, WsProvider } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import { sendTx } from '@skyekiwi/util';
import { config } from 'dotenv'
config();

import scriptConfig from './config.mjs';
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

    const createEnclaveAccount = api.tx.sAccount.createAccount(0);

    await sendTx(createEnclaveAccount, keypair, true);
}

main()
    .catch(err => {
        console.error(err);
    })
    .finally(() => {
        process.exit(0)
    })