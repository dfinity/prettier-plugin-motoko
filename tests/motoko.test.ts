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

    test('comments', () => {
        expect(format('let/*{{*/x = 0; //x\n (x)')).toStrictEqual(
            'let /*{{*/ x = 0; //x\n(x)\n',
        );
    });

    test('block with existing newline', () => {
        expect(format('{a;\nb}')).toStrictEqual('{\n  a;\n  b\n}\n');
    });

    test('extra newlines', () => {
        expect(format('a;\n\n\n\n\nb')).toStrictEqual('a;\n\nb\n');
    });

    test('group spacing', () => {
        expect(format('{};{a};();(a)')).toStrictEqual('{ };\n{ a };\n();\n(a)\n');
    });

    test('unary / binary operators', () => {
        expect(format('1- + 5')).toStrictEqual('1 - +5\n');
    });

    test('variants / concatenation', () => {
        expect(format('#5')).toStrictEqual('# 5');
        expect(format('# a')).toStrictEqual('#a');
        expect(format('"x"# # a')).toStrictEqual('"x" # #a');
    });

    test('generate diff files from compiler tests', () => {
        let preOutput = '';
        let postOutput = '';

        for (const file of glob.sync(
            join(__dirname, '../../motoko/test/**/*.mo'),
        )) {
            // console.log(file);

            const code = readFileSync(file, 'utf-8');

            const formatted = prettier.format(code, {
                filepath: file,
                plugins: [motokoPlugin],
                // printWidth: 80,
            });

            preOutput += `// >>> ${basename(file)} <<<\n\n${code}\n\n`;
            postOutput += `// >>> ${basename(file)} <<<\n\n${formatted}\n\n`;

            // expect(result).toStrictEqual('let /*{{*/ x = 0; //\n(x)\n');
        }

        writeFileSync(join(__dirname, 'motoko/_CompilerTests_Before.mo'), preOutput);
        writeFileSync(join(__dirname, 'motoko/_CompilerTests_Formatted.mo'), postOutput);
    });
});
