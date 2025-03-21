import { ParserOptions } from 'prettier';
import outOfCharacter from 'out-of-character';
import wasm from '../../wasm';
import { TokenTree } from './parse';

const skipAutomaticSemiForNextLinePrefixes = ['.', '|>', ')', '}', ']'];

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
    options: ParserOptions<TokenTree>,
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

                // Find next non-empty line index (excluding comments)
                let nextLineIndex = i - 1;
                while (
                    nextLineIndex > 0 &&
                    !reversedLinesMaskedComments[nextLineIndex].trim()
                ) {
                    nextLineIndex--;
                }
                // Following line, comments replaced with whitespace, trimmed
                const nextLineMaskedCommentsTrimmed = (
                    reversedLinesMaskedComments[nextLineIndex] || ''
                ).trim();
                // Original index of the next line
                const nextLineOriginalIndex =
                    reversedLineIndices[nextLineIndex];

                if (
                    trimmedLine === '}' &&
                    // Skip if prefix found on next line
                    (!nextLineMaskedCommentsTrimmed ||
                        skipAutomaticSemiForNextLinePrefixes.every(
                            (prefix) =>
                                !nextLineMaskedCommentsTrimmed.startsWith(
                                    prefix,
                                ),
                        )) &&
                    // Skip first block for if/else, try/catch
                    !/^(else|catch|finally)([^a-zA-Z0-9_]|$)/.test(
                        nextLineMaskedCommentsTrimmed,
                    ) &&
                    // Skip comments and string literals
                    (nextLineOriginalIndex === undefined ||
                        !ignoreSpans.some(
                            ([start, end]) =>
                                start <= nextLineOriginalIndex &&
                                nextLineOriginalIndex < end,
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
