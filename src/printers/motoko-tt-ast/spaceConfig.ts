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

// match both "block comments" and "comment groups" (lexer implementation detail)
const blockComment = (tt: TokenTree) =>
    tt.token_tree_type === 'Group'
        ? tt.data[1] === 'Comment'
        : getToken(tt).token_type === 'BlockComment';

const spaceConfig: SpaceConfig = {
    // whitespace rules, prioritized from top to bottom
    rules: [
        // whitespace / comment tokens
        ['LineComment', '_', 'hardline'],
        ['MultiLine', '_', 'hardline'],
        ['_', 'MultiLine', 'hardline'],
        ['Space', '_', 'nil'],
        ['_', 'Space', 'nil'],
        ['Line', '_', 'nil'],
        ['_', 'Line', 'nil'],
        ['_', 'LineComment', 'keep-space'],
        ['_', blockComment, 'keep-space'],
        [blockComment, 'Delim', 'keep'],
        [blockComment, '_', 'keep-space'],
        ['_', tokenStartsWith(' '), 'nil'],
        [tokenEndsWith(' '), '_', 'nil'],

        // delimiters
        ['_', 'Delim', 'nil'],
        ['Delim', '_', 'line'],
        // ['Delim', 'Line', 'nil'],

        // if-then expressions
        [{ left: tokenEquals('if'), main: '_' }, 'Paren', 'space'],

        // unary operators
        [tokenEquals('+'), '_', 'keep'],
        [tokenEquals('-'), '_', 'keep'],
        [tokenEquals('^'), '_', 'keep'],
        // [tokenEquals('#'), 'Ident', 'keep'],

        // tags and concatenation
        ['_', tokenEquals('#'), 'keep-space'],
        [tokenEquals('#'), 'Ident', 'keep'],
        [tokenEquals('#'), '_', 'keep-space'],

        // 'with' keyword
        [tokenEquals('with'), '_', 'keep-space'],

        // soft-wrapping operators
        ['_', 'Dot', 'nil'],
        // ['_', 'Dot', 'softwrap'],
        ['Dot', '_', 'nil'],
        ['Assign', '_', 'space'],

        // prefix/postfix operators
        [{ left: tokenEquals('do'), main: tokenEquals('?') }, '_', 'space'],
        // [tokenEquals('?'), 'Curly', 'keep'],
        [tokenEquals('?'), '_', 'nil'],
        ['_', tokenEquals('!'), 'nil'],

        // space between identifier and group
        [tokenEquals('func'), 'Paren', 'nil'],
        [tokenEquals('func'), 'Angle', 'nil'],
        [keyword, 'Group', 'space'],
        ['Ident', 'Paren', 'nil'],
        ['Ident', 'Square', 'nil'],
        ['Ident', 'Angle', 'nil'],

        // space after dot
        [tokenEndsWith('.'), 'Ident', 'keep'],

        // `async*` / `await*`
        [tokenEquals('async'), tokenEquals('*'), 'nil'],
        [tokenEquals('await'), tokenEquals('*'), 'nil'],

        // groups
        ['Group', 'Paren', 'nil'],
        ['Group', 'Square', 'nil'],
        ['Angle', 'Paren', 'nil'],

        // open/close tokens
        ['Open', '_', 'nil'],
        ['_', 'Close', 'nil'],

        // identifier after float in exponential notation (fixes #74)
        [
            token(
                (token) =>
                    token.token_type === 'Literal' &&
                    /\.[a-z]/i.test(token.data[0]),
            ),
            'Ident',
            'keep',
        ],

        // default
        ['_', '_', 'space'],
    ],
};

export default spaceConfig;
