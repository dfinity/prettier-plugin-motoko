#! /usr/bin/env node
'use strict'

const { readFileSync, fstat, writeFileSync } = require('fs');
const motokoPlugin = require('prettier-plugin-motoko');
const prettier = require('prettier');
const { program } = require('commander');
const glob = require('fast-glob');

// console.log(prettier.getSupportInfo().options);

const { check, paths } = program.option('-c, --check', 'check whether the files are formatted (instead of formatting)').argument('paths...', 'file paths to format (default: **/*.mo)').parse().opts();

prettier.resolveConfig.sync(prettier.resolveConfigFile.sync());

let success = true;

const patterns = paths.length ? path : ['**/*.mo'];
Promise.all(
    patterns.map(async (pattern) => {
        for (const file of await glob(pattern)) {
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
        }
    }),
).catch((err) => console.error(err));

if (!success) {
    process.exit(1);
}
