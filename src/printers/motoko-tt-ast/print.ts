import {
    Token,
    TokenTree,
    GroupType,
} from './../../parsers/motoko-tt-parse/parse';
import { doc, AstPath, Doc, ParserOptions } from 'prettier';
import spaceConfig, { doesTokenTreeMatchPattern } from './spaceConfig';

export type Space =
    | ('nil' | 'space' | 'line' | 'softline' | 'hardline' | 'wrap' | 'softwrap')
    | Space[];

// Documentation: https://github.com/prettier/prettier/blob/main/commands.md
const {
    builders: {
        group,
        fill,
        ifBreak,
        breakParent,
        indent,
        indentIfBreak,
        // label,
        line,
        softline,
        hardline,
        lineSuffix,
        hardlineWithoutBreakParent,
        literallineWithoutBreakParent,
    },
} = doc;

const space = ' ';
// const wrapIndent = indent(line);
const wrapIndent = line;

export function parseSpace(input: Space): Doc {
    if (typeof input === 'string') {
        switch (input) {
            case 'nil':
                return [];
            case 'space':
                return space;
            case 'line':
                return line;
            case 'softline':
                return softline;
            case 'hardline':
                return hardline;
            case 'wrap':
                // return ifBreak(wrapIndent, space);
                return line;
            case 'softwrap':
                // return ifBreak(wrapIndent);
                return softline;
            default:
                throw new Error(`Invalid space type: ${input}`);
        }
    } else if (Array.isArray(input)) {
        return input.map((x) => parseSpace(x));
    }
    throw new Error(`Unknown space: ${JSON.stringify(input)}`);
}

const removeTokenTypes = ['Space', 'Line'];

export default function print(
    path: AstPath<any>,
    options: ParserOptions<any>,
    print: (path: AstPath<any>) => Doc,
    args?: unknown,
): Doc {
    const tree = path.getValue();
    if (tree === null) {
        return '';
    } else {
        const doc = printTokenTree(tree, path, options, print, args);
        return doc || (Array.isArray(doc) && doc.length)
            ? [doc, literallineWithoutBreakParent]
            : doc;
    }
}

function printExact(tree: TokenTree): Doc {
    if (tree.token_tree_type === 'Group') {
        const [trees, groupType, pair] = tree.data;
        const results = trees.map((tt: TokenTree) => printExact(tt));
        return pair
            ? [getTokenText(pair[0][0]), results, getTokenText(pair[1][0])]
            : results;
    }
    if (tree.token_tree_type === 'Token') {
        return getTokenText(tree.data[0]);
    }
    throw new Error(`Unexpected token tree: ${JSON.stringify(tree)}`);
}

function getGroupDelimToken(groupType: GroupType): Token {
    return {
        token_type: 'Delim',
        data:
            groupType === 'Unenclosed' || groupType === 'Curly'
                ? [';', 'Semi']
                : [',', 'Comma'],
    };
}

function printTokenTree(
    tree: TokenTree,
    path: AstPath<any>,
    options: ParserOptions<any>,
    print: (path: AstPath<any>) => Doc,
    args?: unknown,
): Doc {
    if (tree.token_tree_type === 'Group') {
        const [originalTrees, groupType, pair] = tree.data;

        if (groupType === 'BlockComment') {
            return printExact(tree);
        }

        // console.log(originalTrees.map((t) => t.data)); /////

        let shouldBreak = false;
        const trees = originalTrees.filter((tt, i) => {
            if (tt.token_tree_type === 'Token') {
                const token = tt.data[0];
                if (token.token_type === 'Line') {
                    shouldBreak = true;
                }
                return !removeTokenTypes.includes(tt.data[0].token_type) /* &&
                    !(i === 0 && token.token_type === 'Line') &&
                    !(
                        i === originalTrees.length - 1 &&
                        token.token_type === 'Line'
                    ) */;
            }
            return true;
        });

        const results: Doc[] = [];
        let resultGroup: Doc[] = [];
        const endGroup = () => {
            if (resultGroup.length) {
                results.push(
                    // group(resultGroup),
                    fill(resultGroup),
                );
                resultGroup = [];
            }
        };

        // check if the most recent token was a delimiter or separator between token groups

        for (let i = 0; i < trees.length; i++) {
            let a = trees[i]!;

            let isDelim = false;
            let isSeparator = false;
            if (a.token_tree_type === 'Token') {
                const [token] = a.data;
                isDelim = token.token_type === 'Delim';
                isSeparator =
                    isDelim ||
                    ['MultiLine', 'LineComment'].includes(token.token_type);
            }

            if (isSeparator) {
                endGroup();
            }
            const resultArray = isSeparator ? results : resultGroup;
            // add everything except trailing delimiter
            if (!isDelim || i !== trees.length - 1) {
                resultArray.push(
                    isDelim /* && options.replaceComma */
                        ? printToken(getGroupDelimToken(groupType))
                        : printTokenTree(a, path, options, print, args),
                );
            }
            if (i < trees.length - 1) {
                const b = trees[i + 1]!;
                resultArray.push(printBetween(a, b));
            } else if (results.length || resultGroup.length) {
                endGroup();
                // Trailing delimiter
                if (
                    (!isSeparator || isDelim) &&
                    options.trailingComma !== 'none'
                ) {
                    results.push(
                        ifBreak(printToken(getGroupDelimToken(groupType))),
                    );
                }
            }
        }
        // endGroup();

        const pairSpace: Doc =
            results.length === 0
                ? []
                : groupType === 'Curly' && options.bracketSpacing
                ? line
                : softline;

        const resultDoc = pair
            ? [
                  printToken(pair[0][0]),
                  //   pairSpace,
                  //   results,
                  indent([pairSpace, results]),
                  pairSpace,
                  printToken(pair[1][0]),
              ]
            : results;

        return group(resultDoc, {
            shouldBreak,
        });
    } else if (tree.token_tree_type === 'Token') {
        const [token] = tree.data;

        return printToken(token);
    }

    throw new Error(`Unexpected token tree: ${JSON.stringify(tree)}`);
}

function printToken(token: Token): Doc {
    switch (token.token_type) {
        case 'Space':
            return space;
        case 'Line':
            // return breakParent;
            return hardline;
        case 'MultiLine':
            // return [breakParent, hardline];
            // return [hardline, hardline];
            return [breakParent];
        case 'LineComment':
            // return [token.data, hardline];
            return token.data;
        // return token.data;
        // return lineSuffix(token.data);
    }
    return getTokenText(token);
}

function printBetween(a: TokenTree, b: TokenTree): Doc {
    const rule = spaceConfig.rules.find(([aPattern, bPattern]) => {
        return (
            doesTokenTreeMatchPattern(a, aPattern) &&
            doesTokenTreeMatchPattern(b, bPattern)
        );
    });
    return rule ? parseSpace(rule[2]) : [];
}

export function getTokenText(token: Token): string {
    if (Array.isArray(token.data)) {
        return token.data[0];
    } else {
        return token.data;
    }
}
