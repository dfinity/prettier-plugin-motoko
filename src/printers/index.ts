import motokoTokenTreeAST, { MOTOKO_TT_AST } from './motoko-tt-ast';

const printers = {
    [MOTOKO_TT_AST]: motokoTokenTreeAST,
};
export default printers;
