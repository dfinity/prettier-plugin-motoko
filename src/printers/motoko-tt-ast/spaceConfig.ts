import { getTokenText as getTokenText, Space } from './print';
import {
    Token,
    TokenTree,
    GroupType,
} from '../../parsers/motoko-tt-parse/parse';
import wasm from '../../wasm';

type Pattern =
    | Token['token_type']
    | TokenTree['token_tree_type']
    | GroupType
    | ((tt: TokenTree) => boolean)
    | '_';

interface SpaceConfig {
    rules: [Pattern, Pattern, Space][];
}

export function doesTokenTreeMatchPattern(
    tt: TokenTree,
    pattern: Pattern,
    // leftMap: Map<TokenTree, TokenTree>,
    // rightMap: Map<TokenTree, TokenTree>,
): boolean {
    if (pattern === '_') {
        return true;
    }
    if (typeof pattern === 'function') {
        return pattern(tt);
    }
    if (tt.token_tree_type === pattern) {
        return true;
    }
    // if (typeof pattern === 'string') {
    //     if (pattern.includes('<')) {
    //         const [otherPattern, mainPattern] = splitAt(
    //             pattern,
    //             pattern.indexOf('<'),
    //             1,
    //         );
    //         const other = leftMap.get(tt);
    //         return (
    //             doesTokenTreeMatchPattern(
    //                 other,
    //                 otherPattern as Pattern,
    //                 leftMap,
    //                 rightMap,
    //             ) &&
    //             doesTokenTreeMatchPattern(tt, mainPattern as Pattern, leftMap, rightMap)
    //         );
    //     }
    //     if (pattern.includes('>')) {
    //     }
    // }
    if (tt.token_tree_type === 'Token') {
        const token = tt.data[0];
        if (token.token_type === pattern) {
            return true;
        }
    }
    if (tt.token_tree_type === 'Group') {
        if (tt.data[1] === pattern) {
            return true;
        }
    }
    return false;
}

const splitAt = (s: string, index: number, take?: number): [string, string] => {
    return [s.substring(0, index), s.substring(index + (take || 0))];
};

const keyword = (tt: TokenTree): boolean => {
    if (tt.token_tree_type === 'Token') {
        const [token] = tt.data;
        if (token.token_type === 'Ident' && wasm.is_keyword(token.data)) {
            return true;
        }
    }
    return false;
};

const token =
    (fn: (token: Token) => boolean) =>
    (tt: TokenTree): boolean => {
        return tt.token_tree_type === 'Token' && fn(tt.data[0]);
    };

const tokenEquals = (data: string) =>
    token((token) => getTokenText(token) === data);
const tokenStartsWith = (start: string) =>
    token((token) => getTokenText(token).startsWith(start));
const tokenEndsWith = (end: string) =>
    token((token) => getTokenText(token).endsWith(end));

const spaceConfig: SpaceConfig = {
    // whitespace rules, prioritized from top to bottom
    rules: [
        // whitespace / comment tokens
        ['MultiLine', '_', 'hardline'],
        ['_', 'MultiLine', 'hardline'],
        ['Space', '_', 'nil'],
        ['_', 'Space', 'nil'],
        ['Line', '_', 'nil'],
        ['_', 'Line', 'nil'],
        ['LineComment', '_', 'hardline'],
        ['_', 'LineComment', 'hardline'], // 'keep'
        ['_', 'BlockComment', 'hardline'], // 'keep'
        ['BlockComment', '_', 'hardline'], // 'keep'
        ['_', tokenStartsWith(' '), 'nil'],
        [tokenEndsWith(' '), '_', 'nil'],

        // delimiters
        ['_', 'Delim', 'nil'],
        // [tokenEquals(';'), '_', 'hardline'],
        ['Delim', '_', 'line'],
        // ['Delim', 'Line', 'nil'],

        // unary operators
        [tokenEquals('#'), 'Ident', 'keep-space'],
        [tokenEquals('+'), '_', 'keep-space'],
        [tokenEquals('-'), '_', 'keep-space'],
        [tokenEquals('^'), '_', 'keep-space'],

        // soft-wrapping operators
        ['_', 'Dot', 'nil'],
        // ['_', 'Dot', 'softwrap'],
        ['Dot', '_', 'nil'],
        ['Assign', '_', 'space'],

        // prefix/postfix operators
        [tokenEquals('?'), '_', 'nil'],
        // [tokenEquals('#'), 'Ident', 'nil'], ///
        ['_', tokenEquals('!'), 'nil'],

        // space between identifier and group
        [tokenEquals('func'), 'Group', 'nil'],
        [keyword, 'Group', 'space'],
        // ['Ident', 'Curly', 'nil'],
        ['Ident', 'Paren', 'nil'],
        ['Ident', 'Square', 'nil'],
        ['Ident', 'Angle', 'nil'],

        // groups
        ['Group', 'Paren', 'nil'],
        ['Group', 'Square', 'nil'],
        ['Angle', 'Paren', 'nil'],

        // open/close tokens
        ['Open', '_', 'nil'],
        ['_', 'Close', 'nil'],

        // default
        ['_', '_', 'space'],
    ],
};

export default spaceConfig;
