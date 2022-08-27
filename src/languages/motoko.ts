import { SupportLanguage } from 'prettier';
import { MOTOKO_TT_PARSE } from '../parsers/motoko-tt-parse';

const motokoLanguage: SupportLanguage = {
    linguistLanguageId: 202937027,
    name: 'Motoko',
    // type: 'programming',
    // color: '#fbb03b',
    aceMode: 'text',
    tmScope: 'source.mo',
    extensions: ['.mo', '.did'], // TODO: separate Candid language
    parsers: [MOTOKO_TT_PARSE],
    vscodeLanguageIds: ['motoko'],
    interpreters: [], // TODO?
};

export default motokoLanguage;
