import 'zx/globals'

await $`cd ./contract && cargo build --target wasm32-unknown-unknown --release`
await $`cp ./contract/target/wasm32-unknown-unknown/release/*.wasm ./contract/res/`