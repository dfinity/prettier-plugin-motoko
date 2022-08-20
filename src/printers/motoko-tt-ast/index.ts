import { Printer } from 'prettier';
import print from './print';

export const MOTOKO_TT_AST = 'motoko-tt-ast';

const printer: Printer = {
    print,
};

export default printer;
