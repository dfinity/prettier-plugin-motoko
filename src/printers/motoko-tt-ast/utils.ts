import { TokenTree, Token } from './../../parsers/motoko-tt-parse/parse';
import { Doc } from 'prettier';

/// Get the unmodified source text from a TokenTree
export function getTokenTreeText(tree: TokenTree): string {
    if (tree.token_tree_type === 'Group') {
        const [trees, _, pair] = tree.data;
        const results = trees.map((tt: TokenTree) => getTokenTreeText(tt));
        return (
            pair
                ? [
                      getTokenText(pair[0][0]),
                      ...results,
                      getTokenText(pair[1][0]),
                  ]
                : results
        ).join('');
    }
    if (tree.token_tree_type === 'Token') {
        return getTokenText(tree.data[0]);
    }
    throw new Error(`Unexpected token tree: ${JSON.stringify(tree)}`);
}

/// Get the unmodified source text from a Token
export function getTokenText(token: Token): string {
    if (Array.isArray(token.data)) {
        return token.data[0];
    } else {
        return token.data;
    }
}

/// Unwrap a single Token from a TokenTree
export function getToken(tree: TokenTree | undefined): Token | undefined {
    if (tree && tree.token_tree_type === 'Token') {
        return tree.data[0];
    }
}

/// Remove all line breaks from a Doc
export function withoutLineBreaks(doc: Doc): Doc {
    if (Array.isArray(doc)) {
        return doc.map((d) => withoutLineBreaks(d));
    }
    if (typeof doc === 'object') {
        switch (doc.type) {
            case 'align':
            case 'group':
            case 'indent':
            case 'line-suffix':
                return withoutLineBreaks(doc.contents);
            case 'fill':
                return withoutLineBreaks(doc.parts);
            case 'line':
                return doc.soft ? [] : ' ';
            case 'if-break':
                return withoutLineBreaks(doc.flatContents);
            case 'break-parent':
            case 'line-suffix-boundary': // TODO test
                return [];
        }
    }
    return doc || [];
}
