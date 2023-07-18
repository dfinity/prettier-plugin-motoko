import prettier from 'prettier';
import * as motokoPlugin from '../src/environments/node';
import glob from 'fast-glob';
import { join, basename } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

describe('Motoko compiler suite', () => {
    test('generate diff files from compiler tests', async () => {
        for (const extension of ['mo', 'did']) {
            let preOutput = '';
            let postOutput = '';
            for (const file of glob.sync(
                join(__dirname, `../../motoko/test/**/*.${extension}`),
            )) {
                const code = readFileSync(file, 'utf-8');
                const formatted = await prettier.format(code, {
                    filepath: file,
                    plugins: [motokoPlugin],
                    // semi: false,///
                });
                preOutput += `// >>> ${basename(file)} <<<\n\n${code}\n\n`;
                postOutput += `// >>> ${basename(
                    file,
                )} <<<\n\n${formatted}\n\n`;
            }
            const generatedDir = join(__dirname, 'generated');
            if (!existsSync(generatedDir)) {
                mkdirSync(generatedDir);
            }
            writeFileSync(
                join(generatedDir, `_CompilerTests_Before.${extension}_`),
                preOutput,
            );
            writeFileSync(
                join(generatedDir, `_CompilerTests_Formatted.${extension}_`),
                postOutput,
            );
        }
    });
});
