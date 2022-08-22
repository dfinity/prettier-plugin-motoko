import { Space } from './print';
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

const tokenEquals = (data: string) => token((token) => token.data === data);
const tokenStartsWith = (start: string) =>
    token(
        (token) =>
            typeof token.data === 'string' && token.data.startsWith(start),
    );
const tokenEndsWith = (end: string) =>
    token(
        (token) => typeof token.data === 'string' && token.data.endsWith(end),
    );

const spaceConfig: SpaceConfig = {
    // Whitespace rules, prioritized from top to bottom
    rules: [
        // whitespace / comment tokens
        ['Space', '_', 'nil'],
        ['_', 'Space', 'nil'],
        ['Line', '_', 'nil'],
        ['_', 'Line', 'nil'],
        ['MultiLine', '_', 'nil'],
        ['_', 'MultiLine', 'nil'],
        ['_', 'LineComment', 'wrap'],
        ['LineComment', '_', 'nil'],
        ['_', tokenStartsWith(' '), 'nil'],
        [tokenEndsWith(' '), '_', 'nil'],

        // space between identifier and group
        [keyword, 'Group', 'space'],
        ['Ident', 'Paren', 'nil'],
        ['Ident', 'Square', 'nil'],
        ['Ident', 'Angle', 'nil'],

        // open/close tokens
        ['Open', '_', 'nil'],
        ['_', 'Close', 'nil'],

        // delimiters
        ['_', 'Delim', 'nil'],
        ['Delim', '_', 'line'],

        // soft-wrapping operators
        ['_', 'Dot', 'wrap'],
        ['Dot', '_', 'nil'],
        ['Assign', '_', 'wrap'],

        // prefix/postfix operators
        [tokenEquals('?'), '_', 'nil'],
        [tokenEquals('#'), 'Ident', 'nil'], ///
        ['_', tokenEquals('!'), 'nil'],

        // block comments
        ['_', 'BlockComment', 'wrap'],
        ['BlockComment', '_', 'wrap'],

        // default
        ['_', '_', 'space'],
    ],
};

export default spaceConfig;
