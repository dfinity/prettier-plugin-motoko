// const wasm =
//     typeof window === 'undefined'
//         ? require(String('../wasm/pkg/nodejs/wasm')) // Guard against bundling both wasm files
//         : require('../wasm/pkg/bundler/wasm');

// const wasm =
//     typeof window === 'undefined'
//         ? require(String('../wasm/pkg/nodejs/wasm')) // Guard against bundling both wasm files
//         : require('../wasm/pkg/bundler/wasm');

// export default wasm;

// import * as wasm from '../wasm/pkg/bundler/wasm';

// export default wasm;

let wasm: any = {};

export const setWasm = (newWasm: object) => {
    Object.assign(wasm, newWasm);
};

export default wasm;
