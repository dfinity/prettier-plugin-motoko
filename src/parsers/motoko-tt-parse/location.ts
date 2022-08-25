import { TokenTree } from './parse';

export const locStart = (node: TokenTree | undefined): number => {
    if (node?.token_tree_type) {
        if (node.token_tree_type === 'Token') {
            const [, loc] = node.data;
            return loc.span[1];
        } else if (node.token_tree_type === 'Group') {
            const [trees, _, pair] = node.data;
            if (pair) {
                const [, loc] = pair[0];
                return loc.span[0];
            } else {
                return trees.length ? locStart(trees[0]) : 0;
            }
        }
    }
    throw new Error(`Unexpected token tree: ${JSON.stringify(node)}`);
};

export const locEnd = (node: TokenTree | undefined): number => {
    if (node?.token_tree_type) {
        if (node.token_tree_type === 'Token') {
            const [, loc] = node.data;
            return loc.span[1];
        } else if (node.token_tree_type === 'Group') {
            const [trees, _, pair] = node.data;
            if (pair) {
                const [, loc] = pair[1];
                return loc.span[1];
            } else {
                return trees.length ? locStart(trees[trees.length - 1]) : 0;
            }
        }
    }
    throw new Error(`Unexpected token tree: ${JSON.stringify(node)}`);
};
