import {
    Token,
    TokenTree,
    GroupType,
} from './../../parsers/motoko-tt-parse/parse';
import { doc, AstPath, Doc, ParserOptions } from 'prettier';
import spaceConfig, { doesTokenTreeMatchPattern } from './spaceConfig';
import {
    getToken,
    getTokenText,
    getTokenTreeText,
    withoutLineBreaks,
} from './utils';

export type Space =
    | (
          | 'nil'
          | 'space'
          | 'line'
          | 'softline'
          | 'hardline'
          | 'wrap'
          | 'softwrap'
          | 'keep'
          | 'keep-space'
      )
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

export function parseSpace(
    input: Space,
    a: TokenTree,
    b: TokenTree,
    leftMap: Map<TokenTree, TokenTree>,
    rightMap: Map<TokenTree, TokenTree>,
): Doc {
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
                return line;
            case 'softwrap':
                return softline;
            case 'keep':
            case 'keep-space':
                let right = rightMap.get(a);
                if (right === b) {
                    return input === 'keep-space' ? space : [];
                }
                let result: Doc = space;
                do {
                    const token = getToken(right);
                    if (token) {
                        if (token.token_type === 'MultiLine') {
                            return printToken(token);
                        }
                        if (token.token_type === 'Line') {
                            result = printToken(token);
                        }
                    }
                    right = rightMap.get(right);
                } while (right !== b);
                return result;
            default:
                throw new Error(`Unimplemented space type: ${input}`);
        }
    } else if (Array.isArray(input)) {
        return input.map((x) => parseSpace(x, a, b, leftMap, rightMap));
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

function shouldSkipTokenTree(tree: TokenTree): boolean {
    const token = getToken(tree);
    return !!token && removeTokenTypes.includes(token.token_type);
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
        const [originalTrees, treeType, pair] = tree.data;

        if (treeType === 'BlockComment') {
            return getTokenTreeText(tree);
        }

        // console.log(originalTrees.map((t) => t.data)); /////

        const leftMap = new Map<TokenTree, TokenTree>();
        const rightMap = new Map<TokenTree, TokenTree>();

        const shouldBreak = (
            tt: TokenTree & { _shouldBreak?: boolean },
        ): boolean => {
            if ('_shouldBreak' in tt) {
                // Use incremental cache to reduce time complexity
                return tt._shouldBreak;
            }
            if (tt.token_tree_type === 'Group') {
                const [trees] = tt.data;
                tt._shouldBreak =
                    trees.some((tt) => shouldBreak(tt)) &&
                    !trees.every((tt) => {
                        // Don't force break if all whitespace and/or nested groups
                        const token = getToken(tt);
                        return (
                            !token || // Group
                            token.token_type === 'Line' ||
                            token.token_type === 'MultiLine'
                        );
                    });
            } else {
                const token = getToken(tt);
                if (token) {
                    tt._shouldBreak =
                        token.token_type === 'Line' ||
                        token.token_type === 'MultiLine' ||
                        token.token_type === 'LineComment';
                }
            }
            return tt._shouldBreak;
        };
        let shouldBreakTree = shouldBreak(tree);

        const trees = originalTrees.filter((tt, i) => {
            const left = originalTrees[i - 1];
            if (left) {
                leftMap.set(tt, left);
            }
            const right = originalTrees[i + 1];
            if (right) {
                rightMap.set(tt, right);
            }
            return !shouldSkipTokenTree(tt);
        });

        // Nested groups such as `((a, b, ...))`
        const hasNestedGroup =
            (treeType === 'Square' || treeType === 'Paren') &&
            trees.length === 1 &&
            trees[0].token_tree_type === 'Group';

        const shouldKeepSameLine = () => {
            if (treeType === 'Angle') {
                return true;
            }
            if (treeType === 'Square' || treeType === 'Paren') {
                return !hasNestedGroup && !shouldBreakTree;
            }
            return false;
        };

        const results: Doc[] = [];
        let resultGroup: Doc[] = [];
        let ignoringNextStatement = false;
        const endGroup = () => {
<<<<<<< Updated upstream
            if (resultGroup.length) {
                results.push(
                    // group(resultGroup),
                    fill(resultGroup),
                );
                resultGroup = [];
=======
            if (nextGroup.length) {
                if (nextImport) {
                    imports.push(nextImport);
                    nextImport = null;
                } else {
                    groups.push(fill(nextGroup));
                }
                nextGroup = [];
>>>>>>> Stashed changes
                ignoringNextStatement = false;
            }
        };

        for (let i = 0; i < trees.length; i++) {
            let a = trees[i]!;

            // Check if the most recent token is a delimiter and/or line break separator
            let isDelim = false;
            let isSeparator = false;
            let comment;
            if (a.token_tree_type === 'Token') {
                const [token] = a.data;
                isDelim = token.token_type === 'Delim';
                isSeparator =
                    isDelim ||
                    ['MultiLine', 'LineComment'].includes(token.token_type);

                if (token.token_type === 'LineComment') {
                    comment = getTokenText(token).substring(2).trim();
<<<<<<< Updated upstream
=======
                } else if (
                    token.token_type === 'Ident' &&
                    getTokenText(token) === 'import'
                ) {
                    // Start building an import
                    nextImport = { group: nextGroup };
>>>>>>> Stashed changes
                }
            } else if (a.token_tree_type === 'Group') {
                const [, aType] = a.data;
                if (aType === 'BlockComment') {
                    comment = getTokenTreeText(a).slice(2, -2).trim();
                }
            }

<<<<<<< Updated upstream
            // check for prettier-ignore* comments
=======
            if (nextImport) {
                if (!nextImport.pattern) {
                    // Import name or pattern
                    const token = getToken(a);
                    if (token) {
                        if (token.token_type === 'Ident') {
                            // `import Abc`
                            nextImport.pattern = a;
                            nextImport.name = getTokenText(token);
                        }
                    } else if (a.token_tree_type === 'Group') {
                        const [, groupType] = a.data;
                        if (groupType === 'Curly') {
                            // `import { ... }`
                            nextImport.pattern = a;
                        }
                    }
                } else if (!nextImport.pathToken) {
                    // Import path
                    const token = getToken(a);
                    if (
                        token &&
                        token.token_type === 'Literal' &&
                        token.data[1] === 'Text'
                    ) {
                        nextImport.pathToken = token;
                    }
                }
            }

            // Check for prettier-ignore* comments
>>>>>>> Stashed changes
            if (comment) {
                if (comment === 'prettier-ignore') {
                    ignoringNextStatement = true;
                }
                // else if (comment === 'prettier-ignore-start') {
                //     ignoringUntilEnd = true;
                // } else if (comment === 'prettier-ignore-end') {
                //     ignoringUntilEnd = false;
                // }
            }

            if (isSeparator) {
                endGroup();
            }

            if (ignoringNextStatement) {
                // Print without formatting

                const ignoreDoc = [];
                let tt = a;
                do {
                    ignoreDoc.unshift(getTokenTreeText(tt));
                } while (
                    leftMap.has(tt) &&
                    shouldSkipTokenTree((tt = leftMap.get(tt)))
                );
                resultGroup.push(ignoreDoc);
            } else {
                // Format next token

<<<<<<< Updated upstream
                const resultArray = isSeparator ? results : resultGroup;
                // add everything except trailing delimiter
                if (!isDelim || i !== trees.length - 1) {
=======
                const resultArray = isSeparator ? groups : nextGroup;
                // Add everything except trailing delimiter
                if (!nextImport && !(isDelim && i === trees.length - 1)) {
>>>>>>> Stashed changes
                    resultArray.push(
                        isDelim /* && options.replaceComma */
                            ? printToken(getGroupDelimToken(treeType))
                            : printTokenTree(a, path, options, print, args),
                    );
                }
                if (i < trees.length - 1) {
                    // const b = trees[i + 1]!;
                    resultArray.push(
                        printBetween(trees, i, i + 1, leftMap, rightMap),
                    );
<<<<<<< Updated upstream
                } else if (results.length || resultGroup.length) {
=======
                } else if (!nextImport && (groups.length || nextGroup.length)) {
>>>>>>> Stashed changes
                    endGroup();

                    // Trailing delimiter
                    if (
                        (!isSeparator || isDelim) &&
                        !hasNestedGroup &&
                        !shouldKeepSameLine() &&
                        (treeType === 'Unenclosed' || treeType === 'Curly'
                            ? options.semi
                            : options.trailingComma !== 'none')
                    ) {
<<<<<<< Updated upstream
                        results.push(
                            ifBreak(printToken(getGroupDelimToken(groupType))),
=======
                        groups.push(
                            ifBreak(printToken(getGroupDelimToken(treeType))),
>>>>>>> Stashed changes
                        );
                    }
                }
            }
        }
        endGroup();

<<<<<<< Updated upstream
=======
        if (imports.length) {
            groups.unshift([printImports(imports), hardline]);
        }

>>>>>>> Stashed changes
        const pairSpace: Doc =
            results.length === 0
                ? []
                : treeType === 'Curly' && options.bracketSpacing
                ? line
                : treeType === 'Angle'
                ? []
                : softline;

        const resultDoc = group(
            pair
                ? hasNestedGroup
                    ? [printToken(pair[0][0]), results, printToken(pair[1][0])]
                    : [
                          printToken(pair[0][0]),
                          //   pairSpace,
                          //   results,
                          indent([pairSpace, results]),
                          pairSpace,
                          printToken(pair[1][0]),
                      ]
                : results,
            {
                shouldBreak: shouldBreakTree,
            },
        );
        return shouldKeepSameLine() ? withoutLineBreaks(resultDoc) : resultDoc;
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
            return hardline;
        case 'MultiLine':
            return [breakParent];
        case 'LineComment':
            // return token.data;
            return ifBreak(
                token.data,
                `/* ${token.data.substring(2).trim()} */`,
            );
        // return lineSuffix(token.data);
    }
    return getTokenText(token);
}

function printBetween(
    trees: TokenTree[],
    aIndex: number,
    bIndex: number,
    // a: TokenTree,
    // b: TokenTree,
    leftMap: Map<TokenTree, TokenTree>,
    rightMap: Map<TokenTree, TokenTree>,
): Doc {
    const rule = spaceConfig.rules.find(([aPattern, bPattern]) => {
        return (
            // doesTokenTreeMatchPattern(a, aPattern) &&
            // doesTokenTreeMatchPattern(b, bPattern)
            doesTokenTreeMatchPattern(aPattern, trees, aIndex) &&
            doesTokenTreeMatchPattern(bPattern, trees, bIndex)
        );
    });
    // return rule ? parseSpace(rule[2], a, b, leftMap, rightMap) : [];
    return rule
        ? parseSpace(rule[2], trees[aIndex], trees[bIndex], leftMap, rightMap)
        : [];
}
