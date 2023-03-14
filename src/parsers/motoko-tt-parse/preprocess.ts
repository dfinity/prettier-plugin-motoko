import { ParserOptions } from 'prettier';
import { replace } from 'out-of-character';

const LINE_COMMENT = '//';

export default function preprocess(
    code: string,
    options: ParserOptions<any>,
): string {
    code = code.replace(/\t/g, ' '.repeat(options.tabWidth)); // convert tabs to spaces
    code = replace(code); // remove invisible unicode characters

    if (options.semi) {
        // Infer semicolons
        let nextIndent = 0;
        const reversedLines = code.split('\n').reverse();
        code = reversedLines
            .map((line: string, i: number) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) {
                    return line;
                }
                // if (trimmedLine.startsWith(LINE_COMMENT)) {
                //     const comment = trimmedLine
                //         .substring(LINE_COMMENT.length)
                //         .trim();
                //     return line;
                // }

                let indent = 0;
                while (indent < line.length && line.charAt(indent) === ' ') {
                    indent++;
                }

                const nextTrimmedLine = (reversedLines[i - 1] || '').trim();
                // const previousTrimmedLine = (lines[i + 1] || '').trim();

                if (
                    trimmedLine === '}' &&
                    !/^(else|catch)([^a-zA-Z0-9_]|$)/.test(nextTrimmedLine)
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
