import { Plugin } from 'prettier';
import languages from './languages';
import parsers from './parsers';
import printers from './printers';
import options from './options';

const plugin: Plugin = {
    languages,
    parsers,
    printers,
    options,
};

export default plugin;
