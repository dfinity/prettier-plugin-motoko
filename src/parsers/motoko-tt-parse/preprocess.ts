import { ParserOptions } from 'prettier';
import outOfCharacter from 'out-of-character';
import wasm from '../../wasm';

function getLineIndices(code: string): number[] {
    const indices = [];
    for (let i = 0; i < code.length; i++) {
        if (code[i] === '\n') {
            indices.push(i);
        }
    }
    return indices;
}

function findStringLiterals(code: string) {
    const literals = [];
    let inString = false;
    let start = 0;
    for (let i = 0; i < code.length; i++) {
        if (code[i] === '"' && (i === 0 || code[i - 1] !== '\\')) {
            if (inString) {
                literals.push([start, i]);
                inString = false;
            } else {
                inString = true;
                start = i;
            }
        }
    }
    return literals;
}

// Replace the given spans with space characters
function maskSpans(code: string, spans: [number, number][]) {
    let result = '';
    let currentIndex = 0;
    for (const [start, end] of spans) {
        result += code.substring(currentIndex, start);
        result += code.substring(start, end).replace(/[^\s]/g, ' ');
        currentIndex = end;
    }
    result += code.substring(currentIndex);
    return result;
}

export default function preprocess(
    code: string,
    options: ParserOptions<any>,
): string {
    code = code.replace(/\t/g, ' '.repeat(options.tabWidth)); // convert tabs to spaces
    code = code.replace(/[ \t]+(?=\r?\n)/g, ''); // remove trailing spaces
    code = outOfCharacter.replace(code); // remove invisible unicode characters

    if (options.semi) {
        // Infer semicolons
        const commentSpans: [number, number][] = wasm.find_comments(code);
        const codeMaskedComments = maskSpans(code, commentSpans);
        const stringLiteralSpans = findStringLiterals(codeMaskedComments);
        const ignoreSpans = [...commentSpans, ...stringLiteralSpans];
        const reversedLines = code.split('\n').reverse();
        const reversedLinesMaskedComments = codeMaskedComments
            .split('\n')
            .reverse();
        const reversedLineIndices = getLineIndices(code).reverse();
        let nextIndent = 0;
        code = reversedLines
            .map((line, i) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) {
                    nextIndent = -1;
                    return line;
                }

                let indent = 0;
                while (indent < line.length && line.charAt(indent) === ' ') {
                    indent++;
                }

                // Following line, comments replaced with whitespace, trimmed
                const nextLineMaskedCommentsTrimmed = (
                    reversedLinesMaskedComments[i - 1] || ''
                ).trim();
                const nextLineIndex = reversedLineIndices[i - 1];

                if (
                    trimmedLine === '}' &&
                    // Skip when at end of nested group with indentation
                    (indent <= nextIndent || nextIndent == -1 /* Empty line */) &&
                    // Skip when part of a path expression
                    !nextLineMaskedCommentsTrimmed.startsWith('.') &&
                    // Skip first block for if/else, try/catch
                    !/^(else|catch)([^a-zA-Z0-9_]|$)/.test(
                        nextLineMaskedCommentsTrimmed,
                    ) &&
                    // Skip comments and string literals
                    (nextLineIndex === undefined ||
                        !ignoreSpans.some(
                            ([start, end]) =>
                                start <= nextLineIndex && nextLineIndex < end,
                        ))
                ) {
                    line += ';';
                }

                nextIndent = indent;
                return line;
            })
            .reverse()
            .join('\n');
    }

    return code;
}
