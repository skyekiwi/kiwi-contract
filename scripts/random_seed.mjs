import 'zx/globals'
import { mnemonicGenerate } from '@polkadot/util-crypto';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

await cryptoWaitReady();
const mnemonic = mnemonicGenerate();
const denv = `SEED = '${mnemonic}'`;
await $`echo ${denv} > ./.env`

const keypair = new Keyring({
    type: 'sr25519'
}).addFromUri(mnemonic);

console.log("\n\nThe .env file has been created. You may use the faucet on discord to claim so test tokens");
console.log("Your on-chain address is", chalk.yellow(keypair.address));
