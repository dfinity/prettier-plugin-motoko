type Wasm = any;

const wasm: Wasm = {};
export const setWasm = (newWasm: Wasm) => {
    Object.assign(wasm, newWasm);
};
export default wasm;
