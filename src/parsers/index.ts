import { Parser } from 'prettier';
import tokenTreeParse, { MOTOKO_TT_PARSE } from './motoko-tt-parse';

const parsers: Record<string, Parser> = {
    [MOTOKO_TT_PARSE]: tokenTreeParse,
};

export default parsers;
