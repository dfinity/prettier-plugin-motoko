import { setWasm } from './../wasm';
import * as wasm from '../../wasm/pkg/nodejs/wasm';

setWasm(wasm);

export * from '..';
