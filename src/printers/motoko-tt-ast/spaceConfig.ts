import { Space } from './print';
import {
    Token,
    TokenTree,
    GroupType,
} from '../../parsers/motoko-tt-parse/parse';
import wasm from '../../wasm';
import { getToken, getTokenText } from './utils';

type Pattern =
    | Token['token_type']
    | TokenTree['token_tree_type']
    | GroupType
    | ((tt: TokenTree) => boolean)
    | { main: Pattern; left?: Pattern; right?: Pattern }
    | '_';

interface SpaceConfig {
    rules: [Pattern, Pattern, Space][];
}

export function doesTokenTreeMatchPattern(
    // tt: TokenTree,
    pattern: Pattern,
    trees: TokenTree[],
    index: number,
    // leftMap: Map<TokenTree, TokenTree>,
    // rightMap: Map<TokenTree, TokenTree>,
): boolean {
    const tt = trees[index];
    if (!tt) {
        return false;
    }
    if (pattern === '_') {
        return true;
    }
    if (typeof pattern === 'function') {
        return pattern(tt);
    }
    if (tt.token_tree_type === pattern) {
        return true;
    }
    if (typeof pattern === 'object' && pattern.main) {
        if (
            pattern.main &&
            !doesTokenTreeMatchPattern(pattern.main, trees, index)
        ) {
            return false;
        }
        if (
            pattern.left &&
            !doesTokenTreeMatchPattern(pattern.left, trees, index - 1)
        ) {
            return false;
        }
        if (
            pattern.right &&
            !doesTokenTreeMatchPattern(pattern.right, trees, index + 1)
        ) {
            return false;
        }
        return true;
    }
    if (tt.token_tree_type === 'Token') {
        const token = tt.data[0];
        return token.token_type === pattern;
    }
    if (tt.token_tree_type === 'Group') {
        return tt.data[1] === pattern;
    }
    throw new Error(`Unexpected pattern: ${pattern}`);
}

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
        const token = getToken(tt);
        return !!token && fn(token);
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
        [{ left: tokenEquals('do'), main: tokenEquals('?') }, '_', 'space'],
        // [tokenEquals('?'), 'Curly', 'keep-space'],
        [tokenEquals('?'), '_', 'nil'],
        // [tokenEquals('#'), 'Ident', 'nil'], ///
        ['_', tokenEquals('!'), 'nil'],

        // space between identifier and group
        [tokenEquals('func'), 'Paren', 'nil'],
        [tokenEquals('func'), 'Angle', 'nil'],
        [tokenEquals('shared'), 'Paren', 'nil'],
        [tokenEquals('shared'), 'Angle', 'nil'],
        [keyword, 'Group', 'space'],
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
