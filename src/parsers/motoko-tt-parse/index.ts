import { Parser } from 'prettier';
import { MOTOKO_TT_AST } from '../../printers/motoko-tt-ast';
import parse from './parse';

export const MOTOKO_TT_PARSE = 'motoko-tt-parse';

const parser: Parser = {
    astFormat: MOTOKO_TT_AST,
    parse,
    locStart: (node) => node.span[0],
    locEnd: (node) => node.span[1],
};

export default parser;
