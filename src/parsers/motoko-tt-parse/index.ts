import { Parser } from 'prettier';
import { MOTOKO_TT_AST } from '../../printers/motoko-tt-ast';
import { locEnd, locStart } from './location';
import parse, { TokenTree } from './parse';

export const MOTOKO_TT_PARSE = 'motoko-tt-parse';

const parser: Parser<TokenTree> = {
    astFormat: MOTOKO_TT_AST,
    parse,
    locStart,
    locEnd,
};

export default parser;
