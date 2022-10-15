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
    console.log(prettier.format(input, { ...prettierOptions, ...options })); //////
    return prettier.format(input, { ...prettierOptions, ...options });
};

describe('Motoko imports', () => {
    test('basic imports', () => {
        expect(format('import a "a"')).toStrictEqual('import a "a"');
        expect(format('import a "a";\n\na')).toStrictEqual(
            'import a "a";\n\na;\n',
        );
    });

    test('object pattern imports', () => {
        expect(format('import {x} "a"')).toStrictEqual('import { x } "a";');
        expect(format('import {x\n;y} "a"')).toStrictEqual(
            'import {\n  x;\n  y;\n} "a";',
        );
        expect(format('import {x; y} "b"; import {x\n;y} "a"')).toStrictEqual(
            'import {\n  x;\n  y;\n} "a";\nimport {\n  x;\n  y;\n} "b";',
        );
    });

    test('empty line after imports', () => {
        expect(format('import a "a"; a')).toStrictEqual(
            'import a "a";\n\na;\n',
        );
    });

    test('combine imports', () => {
        expect(format('import b "b";\n// xyz\nimport b "b"')).toStrictEqual(
            'import a "a";\nimport b "b";\n\n// xyz\n',
        );
    });
});
