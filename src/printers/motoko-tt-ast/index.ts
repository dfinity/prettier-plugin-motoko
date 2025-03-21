import { Printer } from 'prettier';
import { TokenTree } from '../../parsers/motoko-tt-parse/parse';
import print from './print';

export const MOTOKO_TT_AST = 'motoko-tt-ast';

const printer: Printer<TokenTree> = {
    print,
};

export default printer;
