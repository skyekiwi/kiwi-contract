import 'zx/globals'

await $`cd ./src && cargo build --target wasm32-unknown-unknown --release`
await $`cp ./src/target/wasm32-unknown-unknown/release/*.wasm ./src/res/`