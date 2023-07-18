import prettier from 'prettier';
import * as motokoPlugin from '../src/environments/node';
import glob from 'fast-glob';
import { join, basename } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const prettierOptions: prettier.Options = {
    plugins: [motokoPlugin],
    filepath: 'Main.mo',
};

const format = async (input: string, options?: prettier.Options): Promise<string> => {
    return prettier.format(input, { ...prettierOptions, ...options });
};

const expectFormatted = async(input: string) =>
    expect(await format(input)).toStrictEqual(input);

describe('Motoko formatter',  () => {
    test('empty', async () => {
        expect(await format('')).toStrictEqual('');
        expect(await format('\n\n\n')).toStrictEqual('');
    });

    test('trailing newline', async () => {
        expect(await format('a')).toStrictEqual('a\n');
    });

    test('extra whitespace', async () => {
        expect(await format('\n\na')).toStrictEqual('a\n');
        expect(await format('\n\na\n\n')).toStrictEqual('a\n');
        expect(await format('\n\na;\n\n\nb;\n\n')).toStrictEqual('a;\n\nb;\n');
    });

    test('empty block', async () => {
        expect(await format('{\n\n}')).toStrictEqual('{\n\n};\n');
    });

    test('already formatted', async () => {
        await expectFormatted('let x = 0;\n');
    });

    test('line comments',async () => {
        expect(await format('{//\n}//')).toStrictEqual('{\n  //\n} //\n');
        expect(await format('{\n//\n};\n//')).toStrictEqual('{\n  //\n};\n//\n');
        expect(await format('//a\n//b')).toStrictEqual('//a\n//b\n');
        expect(await format('//a\n\n\n//b')).toStrictEqual('//a\n\n//b\n');
    });

    test('block comments', async () => {
        for (let i = 0; i < 10; i++) {
            await expectFormatted(`/*${'*'.repeat(i)}*/\n`);
        }
        expect(await format('let/*{{*/x = 0;//x\n (x)')).toStrictEqual(
            'let /*{{*/ x = 0; //x\n(x);\n',
        );
        expect(await format('/**//**/')).toStrictEqual('/**/ /**/\n');
        expect(await format('\n/**/\n\n\n/**/')).toStrictEqual('/**/\n\n/**/\n');
        expectFormatted('/*=*/\n');
        expectFormatted('/**=*/\n');
        expectFormatted('/**=**/\n');
        expectFormatted('/** **/\n');
        expectFormatted('/*** **/\n');
        expectFormatted('/** ***/\n');
        expectFormatted('/****\n-----\n******/\n');
        expectFormatted('{\n  /****\n  -----\n  ******/;\n};\n');
    });

    test('block with existing newline', async () => {
        expect(await format('{a;\nb}')).toStrictEqual('{\n  a;\n  b;\n};\n');
    });

    test('extra newlines',async  () => {
        expect(await format('a;\n\n\n\n\nb')).toStrictEqual('a;\n\nb;\n');
    });

    test('group spacing', async () => {
        expect(await format('{};{a};();(a)')).toStrictEqual('{}; { a }; (); (a)\n');
    });

    test('unary operators', async () => {
        expect(await format('-+5')).toStrictEqual('-+5\n');
        expect(await format('+-a')).toStrictEqual('+-a\n');
        expect(await format('+ - ^5')).toStrictEqual('+ - ^5\n');
        expect(await format('^ ^a')).toStrictEqual('^ ^a\n');
        expect(await format('^ ^ a')).toStrictEqual('^ ^ a\n');
    });

    test('unary / binary operators',async  () => {
        expect(await format('1 +   5')).toStrictEqual('1 + 5\n');
        expect(await format('1./+5')).toStrictEqual('1. / +5\n');
    });

    test('variants / text concatenation', async () => {
        expect(await format('# "A"')).toStrictEqual('# "A"\n');
        expect(await format('# 5')).toStrictEqual('# 5\n');
        expect(await format('#a')).toStrictEqual('#a\n');
        expect(await format('"A" # b')).toStrictEqual('"A" # b\n');
        expect(await format('"A" # #b')).toStrictEqual('"A" # #b\n');
        expect(await format('"A"# b')).toStrictEqual('"A" # b\n');
        expect(await format('"A"#"B"')).toStrictEqual('"A" # "B"\n');
        expect(await format('"A"# #b')).toStrictEqual('"A" # #b\n');
        expect(await format('"A" #\n"B"')).toStrictEqual('"A" #\n"B";\n');
    });

    test('do ? / optional', async () => {
        expect(await format('?{}')).toStrictEqual('?{}\n');
        expect(await format('do?{}')).toStrictEqual('do ? {}\n');
    });

    test('anonymous functions', async () => {
        expect(await format('func ():() {}')).toStrictEqual('func() : () {}\n');
        expect(await format('func <T> () {}')).toStrictEqual('func<T>() {}\n');
    });

    test('if-else wrapping', async () => {
        expect(await format('if true () else ()')).toStrictEqual(
            'if true () else ()\n',
        );
        expect(await format('if true {} else {}')).toStrictEqual(
            'if true {} else {}\n',
        );
        expect(await format('if true (a) else (b)')).toStrictEqual(
            'if true (a) else (b)\n',
        );
        expect(
            await format('if true {\na} else if false {\nb} else {\nc}'),
        ).toStrictEqual(
            'if true {\n  a;\n} else if false {\n  b;\n} else {\n  c;\n};\n',
        );
    });

    test('type bindings',async () => {
        expect(await format('func foo<A<:Any>(x:A) {}')).toStrictEqual(
            'func foo<A <: Any>(x : A) {}\n',
        );
        expect(await format('func foo <A <: Any>(x:A) {}')).toStrictEqual(
            'func foo<A <: Any>(x : A) {}\n',
        );
    });

    test('tuple line breaks', async () => {
        const wrapped = `(${Array(5)
            .fill(['\n  ' + 'x'.repeat(20)])
            .join(',')},\n);\n`;
        expect(await format(wrapped)).toStrictEqual(wrapped);
    });

    test('nested group line breaks', async () => {
        expect(
           await format(
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

    test('type binding line breaks',async  () => {
        const parens = `<(${Array(5)
            .fill(['x'.repeat(20)])
            .join(', ')})>;\n`;
        expect(await format(parens)).toStrictEqual(parens);

        const curly = `<{ ${Array(5)
            .fill(['x'.repeat(20)])
            .join('; ')} }>;\n`;
        expect(await format(parens)).toStrictEqual(parens);
    });

    // test('multi-line statement indentation', () => {
    //     const ident = 'x'.repeat(50)
    //     expect(await format(`${ident}.${ident}.${ident}`)).toStrictEqual(`${ident}\n  .${ident}\n  .${ident}\n`);
    // });

    test('dot after group',async  () => {
        expect(await format('().0')).toStrictEqual('().0\n');
        // expect(await format('(\n).0')).toStrictEqual('().0\n');
        expect(await format('(\n\n\n).0')).toStrictEqual('().0\n');
        expect(await format('(\na\n).0')).toStrictEqual('(\n  a\n).0;\n');
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

    test('replace delimiters',async  () => {
        expect(await format('(a;b;c)')).toStrictEqual('(a, b, c)\n');
        expect(await format('{a,b,c}')).toStrictEqual('{ a; b; c }\n');
    });

    test('add trailing delimiters', async () => {
        expect(await format('(a\n,b,c)')).toStrictEqual('(\n  a,\n  b,\n  c,\n);\n');
        expect(await format('(a\n,b,c,)')).toStrictEqual('(\n  a,\n  b,\n  c,\n);\n');
        expect(await format('(a\n,b,c,)', { trailingComma: 'none' })).toStrictEqual(
            '(\n  a,\n  b,\n  c\n);\n',
        );
        expect(await format('(a\n,b,c,)', { semi: false })).toStrictEqual(
            '(\n  a,\n  b,\n  c,\n)\n',
        );
    });

    test('remove trailing delimiters',async  () => {
        expect(await format('(a,b,c,)')).toStrictEqual('(a, b, c)\n');
    });

    test('no delimiter for record extension',async  () => {
        expect(await format('{\na}')).toStrictEqual('{\n  a;\n};\n');
        expect(await format('{\na : b}')).toStrictEqual('{\n  a : b;\n};\n');
        expect(await format('{\na = b}')).toStrictEqual('{\n  a = b;\n};\n');
        expect(await format('{\na and b}')).toStrictEqual('{\n  a and b\n};\n');
        expect(await format('{\na with b = c}')).toStrictEqual(
            '{\n  a with b = c\n};\n',
        );
        expect(await format('{\na and b;}')).toStrictEqual('{\n  a and b;\n};\n');
        // expect(await format('{\na : A and B}')).toStrictEqual('{\n  a : A and B;\n};\n');
        // expect(await format('{\na = b and c}')).toStrictEqual('{\n  a = b and c;\n};\n');
    });

    test('bracket spacing', async () => {
        expect(await format('{abc}')).toStrictEqual('{ abc }\n');
        expect(await format('{ abc }', { bracketSpacing: false })).toStrictEqual(
            '{abc}\n',
        );
    });

    test('prettier-ignore',async  () => {
        expect(await format('//prettier-ignore\n1*1;\n2*2')).toStrictEqual(
            '//prettier-ignore\n1*1;\n2 * 2;\n',
        );
        expect(await format('//prettier-ignore\n1*1;\n\n2*2')).toStrictEqual(
            '//prettier-ignore\n1*1;\n\n2 * 2;\n',
        );
        expect(await format('// prettier-ignore\n{\nabc}')).toStrictEqual(
            '// prettier-ignore\n{\nabc}\n',
        );
        expect(await format('/*prettier-ignore*/{\nabc\n\n1}')).toStrictEqual(
            '/*prettier-ignore*/{\nabc\n\n1}\n',
        );
    });

    // test('prettier-ignore-start / prettier-ignore-end', () => {
    //     expect(await format('//prettier-ignore-start\n1*1;//prettier-ignore-end\n2*2')).toStrictEqual(
    //         '//prettier-ignore-start\n1*1;//prettier-ignore-end\n2 * 2;\n',
    //     );
    //     expect(await format('/* prettier-ignore-start */{1\nabc/*prettier-ignore-end*/};abc')).toStrictEqual(
    //         '/* prettier-ignore-start */{1\nabc/*prettier-ignore-end*/\n};\nabc;\n',
    //     );
    // });

    test('identifier tokens', async () => {
        expect(await format('x.0.e0x')).toStrictEqual('x.0.e0x\n');
        expect(await format('x.0.e0 x')).toStrictEqual('x.0.e0 x\n');
    });

    test('exponential notation',async  () => {
        expect(await format('1e1')).toStrictEqual('1e1\n');
        expect(await format('1e-1')).toStrictEqual('1e-1\n');
        expect(await format('1.e1')).toStrictEqual('1.e1\n');
        expect(await format('.1e1')).toStrictEqual('.1e1\n');
    });

    test('hexadecimal notation', async () => {
        expect(await format('0xf')).toStrictEqual('0xf\n');
        expect(await format('0xF')).toStrictEqual('0xF\n');
        expect(await format('0xf_f')).toStrictEqual('0xf_f\n');
        expect(await format('0xF_f')).toStrictEqual('0xF_f\n');
        expect(await format('0xF_F')).toStrictEqual('0xF_F\n');
    });

    test('array indexing line break', async () => {
        expect(await format(`${'x'.repeat(80)}[0]`)).toStrictEqual(
            `${'x'.repeat(80)}[0];\n`,
        );
        expect(await format(`${'x'.repeat(80)}[\n0]`)).toStrictEqual(
            `${'x'.repeat(80)}[\n  0\n];\n`,
        );
        expect(await format(`${'x'.repeat(80)}[0,]`)).toStrictEqual(
            `${'x'.repeat(80)}[0];\n`,
        );
        // expect(await format(`${'x'.repeat(80)}[[\na]]`)).toStrictEqual(
        //     `${'x'.repeat(80)}[\n  [\n    a,\n  ],\n];\n`,
        // );
    });

    test('anonymous function line break', async () => {
        expect(await format('(func() {\na\n})')).toStrictEqual(
            '(\n  func() {\n    a;\n  }\n);\n',
        );
    });

    test('line comment in single line', async () => {
        expect(await format('a<(b,\n//c\n)>()')).toStrictEqual('a<(b, /* c */)>()\n');
    });

    test('prettier-ignore line comment as first line in block',async  () => {
        expect(await format('{\n// prettier-ignore\n  123}')).toStrictEqual(
            '{\n  // prettier-ignore\n  123\n};\n',
        );
    });

    test('unclosed quotes in comments',async  () => {
        expect(await format("// a'b\n '")).toStrictEqual("// a'b\n';\n");
        expect(await format('// a"b\n "')).toStrictEqual('// a"b\n";\n');
        expect(await format("//'\n '")).toStrictEqual("//'\n';\n");
        expect(await format('//"\n "')).toStrictEqual('//"\n";\n');

        expect(await format("/*'*/  '")).toStrictEqual("/*'*/ '\n");
        expect(await format('/*;"*/  "')).toStrictEqual('/*;"*/ "\n');
        expect(await format("/* a'b */  '")).toStrictEqual("/* a'b */ '\n");
        expect(await format('/* a"b */  "')).toStrictEqual('/* a"b */ "\n');
    });

    test('shared and query keywords', async () => {
        expect(await format('shared({})')).toStrictEqual('shared ({})\n');
        expect(await format('shared query({})')).toStrictEqual('shared query ({})\n');
    });

    test('tuple indices',async  () => {
        expect(await format('x.0.y')).toStrictEqual('x.0.y\n');
        expect(await format('0. y')).toStrictEqual('0. y\n');
        expect(await format('0.\ny')).toStrictEqual('0.\ny;\n');
    });

    // test('automatic semicolons', () => {
    //     expect(await format('{\n}\nA\n')).toStrictEqual('{};\nA;\n');
    //     expect(await format('{\n// }\n}\nA\n')).toStrictEqual('{\n  // }\n};\nA;\n');
    // });

    test('conditional parentheses',async  () => {
        expect(await format('if a b')).toStrictEqual('if a b\n');
        expect(await format('if (a) b')).toStrictEqual('if (a) b\n');
        expect(await format('if a (b)')).toStrictEqual('if a (b)\n');
        expect(await format('if (a) (b)')).toStrictEqual('if (a) (b)\n');
    });

    test('async*',async  () => {
        expect(await format('async* T')).toStrictEqual('async* T\n');
        expect(await format('async * T')).toStrictEqual('async* T\n');
    });

    test('await*', async () => {
        expect(await format('await * t')).toStrictEqual('await* t\n');
    });

    test('quote literals', async () => {
        expect(await format("'\\\"'; //abc")).toStrictEqual("'\\\"'; //abc\n");
    });

    test('trailing comma in square brackets', async () => {
        expect(await format('[\na,b]')).toStrictEqual('[\n  a,\n  b,\n];\n');
        expect(await format('[\na,]')).toStrictEqual('[\n  a,\n];\n');
        expect(await format('x : [\nT\n]')).toStrictEqual('x : [\n  T\n];\n');
    });

    test('comma-parentheses',async  () => {
        expect(await format('if(\nx) { y }')).toStrictEqual('if (\n  x\n) { y };\n');
    });

    test('trailing semicolon after block comment', async () => {
        expect(await format('x;\n/**/')).toStrictEqual('x;\n/**/\n');
        expect(await format('x;\n/*\n*/')).toStrictEqual('x;\n/*\n*/\n');
    });

    test('invisible unicode characters', async () => {
        expect(await format('let x\u200b = 123;')).toStrictEqual('let x = 123;\n');
    });

    test('`with` keyword',async  () => {
        expect(await format('{a and b with c = d}')).toStrictEqual(
            '{ a and b with c = d }\n',
        );
        expect(await format('{a and b with\nc = d}')).toStrictEqual(
            '{\n  a and b with\n  c = d\n};\n',
        );
        expect(await format('{a and b with \nc = d}')).toStrictEqual(
            '{\n  a and b with\n  c = d\n};\n',
        );
        expect(await format('{a and b with\nc = d; e = f;}')).toStrictEqual(
            '{\n  a and b with\n  c = d;\n  e = f;\n};\n',
        );
    });

    test('multi-line text', async () => {
       await expectFormatted('"A\nB"\n');
       await    expectFormatted('"  A\n  B"\n');
       await    expectFormatted('"A\n\nB"\n');
       await   expectFormatted('"A\n\n  B"\n');
        await   expectFormatted('"\nA\n\n  B\n    "\n');
        await   expectFormatted('"\n\n{\n}\n\n"\n');
    });
});
