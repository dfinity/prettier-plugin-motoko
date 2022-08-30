#! /usr/bin/env node
'use strict'

const { readFileSync, fstat, writeFileSync } = require('fs');
const motokoPlugin = require('prettier-plugin-motoko');
const prettier = require('prettier');
const { program } = require('commander');
const glob = require('fast-glob');

// console.log(prettier.getSupportInfo().options);

const { check } = program
    .argument('[paths...]', 'file paths to format', ['**/*.mo'])
    .option('-c, --check', 'check whether the files are formatted (instead of formatting)')
    .parse()
    .opts();

prettier.resolveConfig.sync(prettier.resolveConfigFile.sync());

let success = undefined;

Promise.all(
    program.processedArgs[0].map(async (pattern) => {
        for (const file of await glob(pattern, { onlyFiles: true })) {
            const source = readFileSync(file, 'utf-8');
            const shouldFormat = !prettier.check(source, {
                plugins: [motokoPlugin],
                filepath: '*.mo',
            });
            if (check) {
                if (shouldFormat) {
                    console.log('!', file);
                    success = false;
                }
            } else if (shouldFormat) {
                const formatted = prettier.format(source, {
                    plugins: [motokoPlugin],
                    filepath: '*.mo',
                });
                if (source.trim() && !formatted) {
                    success = false;
                    console.log('!!', file);
                } else {
                    writeFileSync(file, formatted);
                    console.log('*', file);
                }
            }
            if (success === undefined) {
                success = true;
            }
        }
    }),
).catch((err) => console.error(err));

if (!success) {
    process.exit(1);
}
