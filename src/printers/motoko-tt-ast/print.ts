import { Token, TokenTree } from './../../parsers/motoko-tt-parse/parse';
import { doc, AstPath, Doc, ParserOptions } from 'prettier';

const {
    builders: { group, ifBreak, indent, label, line, softline },
} = doc;

export default function print(
    path: AstPath<any>,
    options: ParserOptions<any>,
    print: (path: AstPath<any>) => Doc,
    args?: unknown,
): Doc {
    // console.log(arguments); /////

    return printTokenTree(path.getValue(), path, options, print, args);
}

function printTokenTree(
    tree: TokenTree,
    path: AstPath<any>,
    options: ParserOptions<any>,
    print: (path: AstPath<any>) => Doc,
    args?: unknown,
): Doc {
    // console.log(tree);

    if (tree === null) {
        return '';
    } else if (tree.token_tree_type === 'Group') {
        const [tokens, type, pair] = tree.data;

        // console.log(tokens);

        console.log(pair);

        let results = [];
        if (pair) {
            // console.log(pair[0])///
            results.push(printToken(pair[0][0]));
        }
        for (let i = 0; i < tokens.length; i++) {
            const a = tokens[i]!;
            results.push(printTokenTree(a, path, options, print, args));
            if (i < tokens.length - 1) {
                const b = tokens[i + 1]!;
                results.push(printBetween(a, b));
            }
        }
        if (pair) {
            results.push(printToken(pair[1][0]));
        }

        return results;
    } else if (tree.token_tree_type === 'Token') {
        const [token, source] = tree.data;

        // console.log(token, source);

        return getTokenData(token);
    }

    throw new Error(`Unexpected token tree: ${JSON.stringify(tree)}`);
}

function printToken(token: Token): Doc {
    switch (token.token_type) {
        case 'Space':
            return [];
        case 'Line':
            return [line];
        case 'MultiLine':
            return [line, line];
    }
    return getTokenData(token);
}

function printBetween(a: TokenTree, b: TokenTree): Doc {
    return [];
}

function getTokenData(token: Token): string {
    if (Array.isArray(token.data)) {
        return token.data[0];
    } else {
        return token.data;
    }
}
