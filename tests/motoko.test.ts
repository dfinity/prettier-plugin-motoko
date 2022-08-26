import prettier from 'prettier';
import * as motokoPlugin from '../src';
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

describe('Motoko formatter', () => {
    test('empty', () => {
        expect(format('')).toStrictEqual('');
    });

    test('empty block', () => {
        expect(format('{\n\n}')).toStrictEqual('{\n\n};\n');
    });

    test('comments', () => {
        // expect(format('{//\n}//')).toStrictEqual('{\n  //\n} //\n');
        expect(format('//a\n//b')).toStrictEqual('//a\n//b\n');
        // expect(format('let/*{{*/x = 0; //x\n (x)')).toStrictEqual(
        //     'let /*{{*/ x = 0; //x\n(x)\n',
        // );
    });

    test('block with existing newline', () => {
        expect(format('{a;\nb}')).toStrictEqual('{\n  a;\n  b;\n};\n');
    });

    test('extra newlines', () => {
        expect(format('a;\n\n\n\n\nb')).toStrictEqual('a;\n\nb;\n');
    });

    test('group spacing', () => {
        expect(format('{};{a};();(a)')).toStrictEqual('{}; { a }; (); (a)\n');
    });

    test('unary operators', () => {
        expect(format('-+5')).toStrictEqual('-+5\n');
        expect(format('+-a')).toStrictEqual('+-a\n');
        expect(format('+ - ^5')).toStrictEqual('+ - ^5\n');
        expect(format('^ ^a')).toStrictEqual('^ ^a\n');
        expect(format('^ ^ a')).toStrictEqual('^ ^ a\n');
    });

    test('unary / binary operators', () => {
        expect(format('1 +   5')).toStrictEqual('1 + 5\n');
        expect(format('1./+5')).toStrictEqual('1. / +5\n');
    });

    test('variants / text concatenation', () => {
        expect(format('# "A"')).toStrictEqual('# "A"\n');
        expect(format('# 5')).toStrictEqual('# 5\n');
        expect(format('#a')).toStrictEqual('#a\n');
        expect(format('"A"# b')).toStrictEqual('"A" # b\n');
        expect(format('"A"# #b')).toStrictEqual('"A" # #b\n');
    });

    test('anonymous functions', () => {
        expect(format('func ():() {}')).toStrictEqual('func() : () {}\n');
        expect(format('func <T> () {}')).toStrictEqual('func<T>() {}\n');
    });

    // test('multi-line statement indentation', () => {
    //     const ident = 'x'.repeat(50)
    //     expect(format(`${ident}.${ident}.${ident}`)).toStrictEqual(`${ident}\n  .${ident}\n  .${ident}\n`);
    // });

    test('dot after group', () => {
        expect(format('().0')).toStrictEqual('().0\n');
        // expect(format('(\n).0')).toStrictEqual('().0\n');
        expect(format('(\n\n).0')).toStrictEqual('(\n\n).0;\n');
    });

    // test('cursor position', () => {
    //     expect(
    //         prettier.formatWithCursor('{abc\n}', { ...config, cursorOffset: 1 }),
    //     ).toStrictEqual({
    //         comments: undefined,
    //         cursorOffset: 4,
    //         formatted: '{\n  abc\n}\n',
    //     });
    // });

    test('replace delimiters', () => {
        expect(format('(a;b;c)')).toStrictEqual('(a, b, c)\n');
        expect(format('{a,b,c}')).toStrictEqual('{ a; b; c }\n');
    });

    test('add trailing delimiters', () => {
        expect(format('(a\n,b,c)')).toStrictEqual('(\n  a,\n  b,\n  c,\n);\n');
        expect(format('(a\n,b,c,)')).toStrictEqual('(\n  a,\n  b,\n  c,\n);\n');
        expect(format('(a\n,b,c,)', { trailingComma: 'none' })).toStrictEqual(
            '(\n  a,\n  b,\n  c\n);\n',
        );
        expect(format('(a\n,b,c,)', { semi: false })).toStrictEqual(
            '(\n  a,\n  b,\n  c,\n)\n',
        );
    });

    test('remove trailing delimiters', () => {
        expect(format('(a,b,c,)')).toStrictEqual('(a, b, c)\n');
    });

    test('bracket spacing', () => {
        expect(format('{abc}')).toStrictEqual('{ abc }\n');
        expect(format('{ abc }', { bracketSpacing: false })).toStrictEqual(
            '{abc}\n',
        );
    });

    // test('generate diff files from compiler tests', () => {
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
    //             semi: false,///
    //         });

    //         preOutput += `// >>> ${basename(file)} <<<\n\n${code}\n\n`;
    //         postOutput += `// >>> ${basename(file)} <<<\n\n${formatted}\n\n`;

    //         // expect(result).toStrictEqual('let /*{{*/ x = 0; //\n(x)\n');
    //     }

    //     writeFileSync(
    //         join(__dirname, 'motoko/_CompilerTests_Before.mo'),
    //         preOutput,
    //     );
    //     writeFileSync(
    //         join(__dirname, 'motoko/_CompilerTests_Formatted.mo'),
    //         postOutput,
    //     );
    // });
});
