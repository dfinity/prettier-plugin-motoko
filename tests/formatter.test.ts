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

    test('already formatted', () => {
        expectFormatted('let x = 0;\n');
    });

    test('line comments', () => {
        expect(format('{//\n}//')).toStrictEqual('{\n  //\n} //\n');
        expect(format('{\n//\n}\n//')).toStrictEqual('{\n  //\n};\n//\n');
        expect(format('//a\n//b')).toStrictEqual('//a\n//b\n');
        expect(format('//a\n\n\n//b')).toStrictEqual('//a\n\n//b\n');
    });

    test('block comments', () => {
        for (let i = 0; i < 10; i++) {
            expectFormatted(`/*${'*'.repeat(i)}*/\n`);
        }
        expect(format('let/*{{*/x = 0;//x\n (x)')).toStrictEqual(
            'let /*{{*/ x = 0; //x\n(x);\n',
        );
        expect(format('/**//**/')).toStrictEqual('/**/ /**/\n');
        expect(format('\n/**/\n\n\n/**/')).toStrictEqual('/**/\n\n/**/\n');
        expectFormatted('/*=*/\n');
        expectFormatted('/**=*/\n');
        expectFormatted('/**=**/\n');
        expectFormatted('/** **/\n');
        expectFormatted('/*** **/\n');
        expectFormatted('/** ***/\n');
        expectFormatted('/****\n-----\n******/\n');
        expectFormatted('{\n  /****\n  -----\n  ******/;\n};\n');
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
        expect(format('"A" # b')).toStrictEqual('"A" # b\n');
        expect(format('"A" # #b')).toStrictEqual('"A" # #b\n');
        expect(format('"A"# b')).toStrictEqual('"A" # b\n');
        expect(format('"A"#"B"')).toStrictEqual('"A" # "B"\n');
        expect(format('"A"# #b')).toStrictEqual('"A" # #b\n');
        expect(format('"A" #\n"B"')).toStrictEqual('"A" #\n"B";\n');
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
        expect(format('(\na\n).0')).toStrictEqual('(\n  a\n).0;\n');
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

    test('no delimiter for record extension', () => {
        expect(format('{\na}')).toStrictEqual('{\n  a;\n};\n');
        expect(format('{\na : b}')).toStrictEqual('{\n  a : b;\n};\n');
        expect(format('{\na = b}')).toStrictEqual('{\n  a = b;\n};\n');
        expect(format('{\na and b}')).toStrictEqual('{\n  a and b\n};\n');
        expect(format('{\na with b = c}')).toStrictEqual(
            '{\n  a with b = c\n};\n',
        );
        expect(format('{\na and b;}')).toStrictEqual('{\n  a and b;\n};\n');
        // expect(format('{\na : A and B}')).toStrictEqual('{\n  a : A and B;\n};\n');
        // expect(format('{\na = b and c}')).toStrictEqual('{\n  a = b and c;\n};\n');
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

    test('identifier tokens', () => {
        expect(format('x.0.e0x')).toStrictEqual('x.0.e0x\n');
        expect(format('x.0.e0 x')).toStrictEqual('x.0.e0 x\n');
    });

    test('exponential notation', () => {
        expect(format('1e1')).toStrictEqual('1e1\n');
        expect(format('1e-1')).toStrictEqual('1e-1\n');
        expect(format('1.e1')).toStrictEqual('1.e1\n');
        expect(format('.1e1')).toStrictEqual('.1e1\n');
    });

    test('hexadecimal notation', () => {
        expect(format('0xf')).toStrictEqual('0xf\n');
        expect(format('0xF')).toStrictEqual('0xF\n');
        expect(format('0xf_f')).toStrictEqual('0xf_f\n');
        expect(format('0xF_f')).toStrictEqual('0xF_f\n');
        expect(format('0xF_F')).toStrictEqual('0xF_F\n');
    });

    test('array indexing line break', () => {
        expect(format(`${'x'.repeat(80)}[0]`)).toStrictEqual(
            `${'x'.repeat(80)}[0];\n`,
        );
        expect(format(`${'x'.repeat(80)}[\n0]`)).toStrictEqual(
            `${'x'.repeat(80)}[\n  0\n];\n`,
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
            '(\n  func() {\n    a;\n  }\n);\n',
        );
    });

    test('line comment in single line', () => {
        expect(format('a<(b,\n//c\n)>()')).toStrictEqual('a<(b, /* c */)>()\n');
    });

    test('prettier-ignore line comment as first line in block', () => {
        expect(format('{\n// prettier-ignore\n  123}')).toStrictEqual(
            '{\n  // prettier-ignore\n  123\n};\n',
        );
    });

    test('unclosed quotes in comments', () => {
        expect(format("// a'b\n '")).toStrictEqual("// a'b\n';\n");
        expect(format('// a"b\n "')).toStrictEqual('// a"b\n";\n');
        expect(format("//'\n '")).toStrictEqual("//'\n';\n");
        expect(format('//"\n "')).toStrictEqual('//"\n";\n');

        expect(format("/*'*/  '")).toStrictEqual("/*'*/ '\n");
        expect(format('/*;"*/  "')).toStrictEqual('/*;"*/ "\n');
        expect(format("/* a'b */  '")).toStrictEqual("/* a'b */ '\n");
        expect(format('/* a"b */  "')).toStrictEqual('/* a"b */ "\n');
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

    test('automatic semicolons', () => {
        expect(format('{\n}\nA\n')).toStrictEqual('{};\nA;\n');
        expect(format('{\n// }\n}\nA\n')).toStrictEqual('{\n  // }\n};\nA;\n');
    });

    test('conditional parentheses', () => {
        expect(format('if a b')).toStrictEqual('if a b\n');
        expect(format('if (a) b')).toStrictEqual('if (a) b\n');
        expect(format('if a (b)')).toStrictEqual('if a (b)\n');
        expect(format('if (a) (b)')).toStrictEqual('if (a) (b)\n');
    });

    test('async*', () => {
        expect(format('async* T')).toStrictEqual('async* T\n');
        expect(format('async * T')).toStrictEqual('async* T\n');
    });

    test('await*', () => {
        expect(format('await * t')).toStrictEqual('await* t\n');
    });

    test('quote literals', () => {
        expect(format("'\\\"'; //abc")).toStrictEqual("'\\\"'; //abc\n");
    });

    test('trailing comma in square brackets', () => {
        expect(format('[\na,b]')).toStrictEqual('[\n  a,\n  b,\n];\n');
        expect(format('[\na,]')).toStrictEqual('[\n  a,\n];\n');
        expect(format('x : [\nT\n]')).toStrictEqual('x : [\n  T\n];\n');
    });

    test('comma-parentheses', () => {
        expect(format('if(\nx) { y }')).toStrictEqual('if (\n  x\n) { y };\n');
    });

    test('trailing semicolon after block comment', () => {
        expect(format('x;\n/**/')).toStrictEqual('x;\n/**/\n');
        expect(format('x;\n/*\n*/')).toStrictEqual('x;\n/*\n*/\n');
    });

    test('invisible unicode characters', () => {
        expect(format('let x\u200b = 123;')).toStrictEqual('let x = 123;\n');
    });

    test('`with` keyword', () => {
        expect(format('{a and b with c = d}')).toStrictEqual(
            '{ a and b with c = d }\n',
        );
        expect(format('{a and b with\nc = d}')).toStrictEqual(
            '{\n  a and b with\n  c = d\n};\n',
        );
        expect(format('{a and b with \nc = d}')).toStrictEqual(
            '{\n  a and b with\n  c = d\n};\n',
        );
        expect(format('{a and b with\nc = d; e = f;}')).toStrictEqual(
            '{\n  a and b with\n  c = d;\n  e = f;\n};\n',
        );
    });

    test('multi-line text', () => {
        expectFormatted('"A\nB"\n');
        expectFormatted('"  A\n  B"\n');
        expectFormatted('"A\n\nB"\n');
        expectFormatted('"A\n\n  B"\n');
        expectFormatted('"\nA\n\n  B\n    "\n');
    });
});
