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

describe('Motoko formatter', () => {
    test('empty', () => {
        expect(format('')).toStrictEqual('');
        expect(format('\n\n\n')).toStrictEqual('');
    });

    test('trailing newline', () => {
        expect(format('a')).toStrictEqual('a\n');
    });

    test('extra whitespace', () => {
        expect(format('\n\na')).toStrictEqual('a\n');
        expect(format('\n\na\n\n')).toStrictEqual('a\n');
        expect(format('\n\na;\n\n\nb;\n\n')).toStrictEqual('a;\n\nb;\n');
    });

    test('empty block', () => {
        expect(format('{\n\n}')).toStrictEqual('{\n\n};\n');
    });

    test('line comments', () => {
        expect(format('{//\n}//')).toStrictEqual('{\n  //\n} //\n');
        expect(format('{\n//\n}\n//')).toStrictEqual('{\n  //\n}\n//\n');
        expect(format('//a\n//b')).toStrictEqual('//a\n//b\n');
        expect(format('//a\n\n\n//b')).toStrictEqual('//a\n\n//b\n');
    });

    test('block comments', () => {
        expect(format('let/*{{*/x = 0;//x\n (x)')).toStrictEqual(
            'let/*{{*/x = 0; //x\n(x);\n',
        );
        expect(format('\n/**/\n\n\n/**/')).toStrictEqual('/**/\n\n/**/;\n');
        expectFormatted('/*****\n-----\n*****/\n');
        expectFormatted('{\n  /*****\n  -----\n  *****/;\n};\n');
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

    test('do ? / optional', () => {
        expect(format('?{}')).toStrictEqual('?{}\n');
        expect(format('do?{}')).toStrictEqual('do ? {}\n');
    });

    test('anonymous functions', () => {
        expect(format('func ():() {}')).toStrictEqual('func() : () {}\n');
        expect(format('func <T> () {}')).toStrictEqual('func<T>() {}\n');
    });

    test('if-else wrapping', () => {
        expect(format('if true () else ()')).toStrictEqual(
            'if true () else ()\n',
        );
        expect(format('if true {} else {}')).toStrictEqual(
            'if true {} else {}\n',
        );
        expect(format('if true (a) else (b)')).toStrictEqual(
            'if true (a) else (b)\n',
        );
        expect(
            format('if true {\na} else if false {\nb} else {\nc}'),
        ).toStrictEqual(
            'if true {\n  a;\n} else if false {\n  b;\n} else {\n  c;\n};\n',
        );
    });

    test('type bindings', () => {
        expect(format('func foo<A<:Any>(x:A) {}')).toStrictEqual(
            'func foo<A <: Any>(x : A) {}\n',
        );
        expect(format('func foo <A <: Any>(x:A) {}')).toStrictEqual(
            'func foo<A <: Any>(x : A) {}\n',
        );
    });

    test('tuple line breaks', () => {
        const wrapped = `(${Array(5)
            .fill(['\n  ' + 'x'.repeat(20)])
            .join(',')},\n);\n`;
        expect(format(wrapped)).toStrictEqual(wrapped);
    });

    test('nested group line breaks', () => {
        expect(
            format(
                `(\n(${Array(5)
                    .fill(['\n' + 'x'.repeat(20)])
                    .join(', ')}));\n`,
            ),
        ).toStrictEqual(
            `((${Array(5)
                .fill(['\n  ' + 'x'.repeat(20)])
                .join(',')},\n));\n`,
        );
    });

    test('type binding line breaks', () => {
        const parens = `<(${Array(5)
            .fill(['x'.repeat(20)])
            .join(', ')})>;\n`;
        expect(format(parens)).toStrictEqual(parens);

        const curly = `<{ ${Array(5)
            .fill(['x'.repeat(20)])
            .join('; ')} }>;\n`;
        expect(format(parens)).toStrictEqual(parens);
    });

    // test('multi-line statement indentation', () => {
    //     const ident = 'x'.repeat(50)
    //     expect(format(`${ident}.${ident}.${ident}`)).toStrictEqual(`${ident}\n  .${ident}\n  .${ident}\n`);
    // });

    test('dot after group', () => {
        expect(format('().0')).toStrictEqual('().0\n');
        // expect(format('(\n).0')).toStrictEqual('().0\n');
        expect(format('(\n\n\n).0')).toStrictEqual('().0\n');
        expect(format('(\na\n).0')).toStrictEqual('(\n  a,\n).0;\n');
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

    test('prettier-ignore', () => {
        expect(format('//prettier-ignore\n1*1;\n2*2')).toStrictEqual(
            '//prettier-ignore\n1*1;\n2 * 2;\n',
        );
        expect(format('//prettier-ignore\n1*1;\n\n2*2')).toStrictEqual(
            '//prettier-ignore\n1*1;\n\n2 * 2;\n',
        );
        expect(format('// prettier-ignore\n{\nabc}')).toStrictEqual(
            '// prettier-ignore\n{\nabc}\n',
        );
        expect(format('/*prettier-ignore*/{\nabc\n\n1}')).toStrictEqual(
            '/*prettier-ignore*/{\nabc\n\n1}\n',
        );
    });

    // test('prettier-ignore-start / prettier-ignore-end', () => {
    //     expect(format('//prettier-ignore-start\n1*1;//prettier-ignore-end\n2*2')).toStrictEqual(
    //         '//prettier-ignore-start\n1*1;//prettier-ignore-end\n2 * 2;\n',
    //     );
    //     expect(format('/* prettier-ignore-start */{1\nabc/*prettier-ignore-end*/};abc')).toStrictEqual(
    //         '/* prettier-ignore-start */{1\nabc/*prettier-ignore-end*/\n};\nabc;\n',
    //     );
    // });

    test('array indexing line break', () => {
        expect(format(`${'x'.repeat(80)}[0]`)).toStrictEqual(
            `${'x'.repeat(80)}[0];\n`,
        );
        expect(format(`${'x'.repeat(80)}[\n0]`)).toStrictEqual(
            `${'x'.repeat(80)}[\n  0,\n];\n`,
        );
        expect(format(`${'x'.repeat(80)}[0,]`)).toStrictEqual(
            `${'x'.repeat(80)}[0];\n`,
        );
        // expect(format(`${'x'.repeat(80)}[[\na]]`)).toStrictEqual(
        //     `${'x'.repeat(80)}[\n  [\n    a,\n  ],\n];\n`,
        // );
    });

    test('anonymous function line break', () => {
        expect(format('(func() {\na\n})')).toStrictEqual(
            '(\n  func() {\n    a;\n  },\n);\n',
        );
    });

    test('line comment in single line', () => {
        expect(format('a<(b,\n//c\n)>()')).toStrictEqual('a<(b, /* c */)>()\n');
    });

    test('unclosed quotes in comments', () => {
        expect(format("// a'b\n '")).toStrictEqual("// a'b\n';\n");
        expect(format('// a"b\n "')).toStrictEqual('// a"b\n";\n');
        expect(format("//'\n '")).toStrictEqual("//'\n';\n");
        expect(format('//"\n "')).toStrictEqual('//"\n";\n');

        expect(format("/*'*/  '")).toStrictEqual("/*'*/ '\n");
        // expect(format('/*"*/  "')).toStrictEqual('/*\n"*/ "\n');
        expect(format("/* a'b */  '")).toStrictEqual("/* a'b */ '\n");
        // expect(format('/* a"b */  "')).toStrictEqual('/* a"b */\n";\n');
    });

    test('shared and query keywords', () => {
        expect(format('shared({})')).toStrictEqual('shared ({})\n');
        expect(format('shared query({})')).toStrictEqual('shared query ({})\n');
    });

    test('tuple indices', () => {
        expect(format('x.0.y')).toStrictEqual('x.0.y\n');
        expect(format('0. y')).toStrictEqual('0. y\n');
        expect(format('0.\ny')).toStrictEqual('0.\ny;\n');
    });

    // test('generate diff files from compiler tests', () => {
    //     for (const extension of ['mo', 'did']) {
    //         let preOutput = '';
    //         let postOutput = '';
    //         for (const file of glob.sync(
    //             join(__dirname, `../../motoko/test/**/*.${extension}`),
    //         )) {
    //             const code = readFileSync(file, 'utf-8');
    //             const formatted = prettier.format(code, {
    //                 filepath: file,
    //                 plugins: [motokoPlugin],
    //                 // semi: false,///
    //             });
    //             preOutput += `// >>> ${basename(file)} <<<\n\n${code}\n\n`;
    //             postOutput += `// >>> ${basename(
    //                 file,
    //             )} <<<\n\n${formatted}\n\n`;
    //         }
    //         writeFileSync(
    //             join(__dirname, `generated/_CompilerTests_Before.${extension}_`),
    //             preOutput,
    //         );
    //         writeFileSync(
    //             join(__dirname, `generated/_CompilerTests_Formatted.${extension}_`),
    //             postOutput,
    //         );
    //     }
    // });
});
