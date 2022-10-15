let wasm: any = {};

export const setWasm = (newWasm: object) => {
    Object.assign(wasm, newWasm);
};

export default wasm;
