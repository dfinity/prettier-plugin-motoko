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

let fileCount = 0;
let successCount = 0;

Promise.all(
    program.processedArgs[0].map(async (pattern) => {
        for (const file of await glob(pattern)) {
            fileCount += 1;
            const source = readFileSync(file, 'utf-8');
            const shouldFormat = !prettier.check(source, {
                plugins: [motokoPlugin],
                filepath: '*.mo',
            });
            if (check) {
                if (shouldFormat) {
                    console.log('!', file);
                } else {
                    successCount++;
                }
            } else if (shouldFormat) {
                const formatted = prettier.format(source, {
                    plugins: [motokoPlugin],
                    filepath: '*.mo',
                });
                if (source.trim() && !formatted) {
                    success = false;
                    console.log('Error:', file);
                } else {
                    writeFileSync(file, formatted);
                    console.log('*', file);
                    successCount++;
                }
            } else {
                successCount++;
            }
        }
    }),
).then(() => {
    if (successCount === fileCount) {
        const fileText = fileCount === 1 ? 'file' : 'files';
        if (check) {
            console.log(`Checked ${fileCount} ${fileText}.`);
        } else {
            console.log(`Formatted ${fileCount} ${fileText}.`);
        }
    }
    else {
        process.exit(1);
    }
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
