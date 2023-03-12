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

const expectFormatted = (input: string) =>
    expect(format(input)).toStrictEqual(input);

describe('Motoko compiler suite', () => {
    test('generate diff files from compiler tests', () => {
        for (const extension of ['mo', 'did']) {
            let preOutput = '';
            let postOutput = '';
            for (const file of glob.sync(
                join(__dirname, `../../motoko/test/**/*.${extension}`),
            )) {
                const code = readFileSync(file, 'utf-8');
                const formatted = prettier.format(code, {
                    filepath: file,
                    plugins: [motokoPlugin],
                    // semi: false,///
                });
                preOutput += `// >>> ${basename(file)} <<<\n\n${code}\n\n`;
                postOutput += `// >>> ${basename(
                    file,
                )} <<<\n\n${formatted}\n\n`;
            }
            writeFileSync(
                join(__dirname, `generated/_CompilerTests_Before.${extension}_`),
                preOutput,
            );
            writeFileSync(
                join(__dirname, `generated/_CompilerTests_Formatted.${extension}_`),
                postOutput,
            );
        }
    });
});
