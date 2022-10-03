import { Doc } from 'prettier';
import { Token, TokenTree } from '../../parsers/motoko-tt-parse/parse';
import { sort } from 'fast-sort';

export type ImportEntry = {
    pattern?: TokenTree; // identifier or object pattern
    name?: string; // identifier (if present)
    pathToken?: Token; // path string
    group: Doc[];
};

export function printImports(imports: ImportEntry[]): Doc[] {
    imports = sort(imports).asc([
        ({ pathToken: path }) => path.data[0], // import path
    ]);

    return imports.map(({ group }) => group);
}
