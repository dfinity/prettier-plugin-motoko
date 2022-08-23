import { Token, TokenTree } from './../../parsers/motoko-tt-parse/parse';
import { doc, AstPath, Doc, ParserOptions } from 'prettier';
import spaceConfig, { doesTokenTreeMatchPattern } from './spaceConfig';

export type Space =
    | ('nil' | 'space' | 'line' | 'softline' | 'hardline' | 'wrap' | 'softwrap')
    | Space[];

// Documentation: https://github.com/prettier/prettier/blob/main/commands.md
const {
    builders: {
        group,
        ifBreak,
        breakParent,
        indent,
        indentIfBreak,
        // label,
        line,
        softline,
        hardline,
        lineSuffix,
        literallineWithoutBreakParent,
    },
} = doc;

const space = ' ';
// const wrapDoc = [hardline /* , indent([]) */]; // TODO check
const wrapIndent = space; ///

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
            case 'wrap':
                return ifBreak(wrapIndent, space);
            case 'softwrap':
                return ifBreak(wrapIndent);
        }
    } else if (Array.isArray(input)) {
        return input.map((x) => parseSpace(x));
    }
    throw new Error(`Unknown space: ${JSON.stringify(input)}`);
}

const removeTokenTypes = ['Space'];

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
            ? [getTokenData(pair[0][0]), results, getTokenData(pair[1][0])]
            : results;
    }
    if (tree.token_tree_type === 'Token') {
        return getTokenData(tree.data[0]);
    }
    throw new Error(`Unexpected token tree: ${JSON.stringify(tree)}`);
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

        const trees = originalTrees.filter((tt, i) => {
            if (tt.token_tree_type === 'Token') {
                const token = tt.data[0];
                return (
                    !removeTokenTypes.includes(tt.data[0].token_type) &&
                    !(i === 0 && token.token_type === 'Line') &&
                    !(
                        i === originalTrees.length - 1 &&
                        token.token_type === 'Line'
                    )
                );
            }
            return true;
        });

        let results = [];
        for (let i = 0; i < trees.length; i++) {
            const a = trees[i]!;
            results.push(printTokenTree(a, path, options, print, args));
            if (i < trees.length - 1) {
                const b = trees[i + 1]!;
                results.push(printBetween(a, b));
            }
        }
        
        const pairSpace =
            groupType === 'Curly'
                ? line
                : groupType === 'Paren'
                ? []
                : softline;

        return group(
            pair
                ? [
                      printToken(pair[0][0]),
                      indent([pairSpace, results]),
                      results.length ? pairSpace : [],
                      printToken(pair[1][0]),
                  ]
                : results,
        );
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
            return [breakParent, hardline];
        case 'LineComment':
            // return [token.data, hardline];
            return token.data;
        // return lineSuffix(token.data);
    }
    return getTokenData(token);
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

function getTokenData(token: Token): string {
    if (Array.isArray(token.data)) {
        return token.data[0];
    } else {
        return token.data;
    }
}
