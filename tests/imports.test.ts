import prettier from 'prettier';
import * as motokoPlugin from '../src/environments/node';
import glob from 'fast-glob';
import { join, basename } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const prettierOptions: prettier.Options = {
    plugins: [motokoPlugin],
    filepath: 'Main.mo',
};

const format = (input: string, options?: prettier.Options): string => {
    return prettier.format(input, { ...prettierOptions, ...options });
};

describe('Motoko imports', () => {
    test('empty line after imports', () => {
        expect(format('import a "a"; a')).toStrictEqual('import a "a";\n\na;\n');
    });

    test('combine imports', () => {
        expect(format('import b "b";\n// xyz\nimport b "b"')).toStrictEqual('import a "a";\nimport b "b";\n\n// xyz\n');
    });
});
