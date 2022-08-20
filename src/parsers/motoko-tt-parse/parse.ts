import wasm from '../../wasm';

type Loc<T> = [T, Source];

export type TokenTree =
    | {
          token_tree_type: 'Group';
          data: [TokenTree[], string, [Loc<Token>, Loc<Token>] | null];
      }
    | {
          token_tree_type: 'Token';
          data: Loc<Token>;
      };

export type Token = {
    token_type: string;
    data: any[];
};

export type Source = {
    span: number;

    line: number;
    col: number;
};

export default function parse(
    text: string,
    parsers: object,
    options: object,
): TokenTree {
    let tt = wasm.parse_token_tree(text);

    console.log(tt);

    return tt;
}
