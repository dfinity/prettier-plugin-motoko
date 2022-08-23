import prettier from 'prettier';
import motokoPlugin from '../src';
import glob from 'fast-glob';
import { join, basename } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const config = {
    filepath: 'Main.mo',
    plugins: [motokoPlugin],
};

const format = (input: string): string => {
    return prettier.format(input, config);
};

describe('Motoko formatter', () => {
    test('empty', () => {
        expect(format('')).toStrictEqual('');
    });

    test('basic example', () => {
        expect(format('let/*{{*/x = 0; //\n (x)')).toStrictEqual(
            'let /*{{*/ x = 0; //\n(x)\n',
        );
    });

    test('block with existing newline', () => {
        expect(format('{a;\nb}')).toStrictEqual('{\n  a;\n  b\n}\n');
    });

    test('extra newlines', () => {
        expect(format('a;\n\n\n\n\nb')).toStrictEqual('a;\n\nb\n');
    });

    // test('generate diff files from dfinity/motoko', () => {
    //     let preOutput = '';
    //     let postOutput = '';

    //     for (const file of glob.sync(
    //         join(__dirname, '../../motoko/test/**/*.mo'),
    //     )) {
    //         // console.log(file);

    //         const code = readFileSync(file, 'utf-8');

    //         const formatted = prettier.format(code, {
    //             filepath: file,
    //             plugins: [motokoPlugin],
    //             // printWidth: 80,
    //         });

    //         preOutput += `// >>> ${basename(file)} <<<\n\n${code}\n\n`;
    //         postOutput += `// >>> ${basename(file)} <<<\n\n${formatted}\n\n`;

    //         // expect(result).toStrictEqual('let /*{{*/ x = 0; //\n(x)\n');
    //     }

    //     writeFileSync(join(__dirname, 'motoko/_CompilerTests_Before.mo'), preOutput);
    //     writeFileSync(join(__dirname, 'motoko/_CompilerTests_Formatted.mo'), postOutput);
    // });
});
