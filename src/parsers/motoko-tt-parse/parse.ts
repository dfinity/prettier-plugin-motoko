import wasm from '../../wasm';

type Loc<T> = [T, Source];

export type GroupType =
    | 'Unenclosed'
    | 'Paren'
    | 'Curly'
    | 'Square'
    | 'Angle'
    | 'BlockComment';

export type TokenTree =
    | {
          token_tree_type: 'Group';
          data: [TokenTree[], GroupType, [Loc<Token>, Loc<Token>] | null];
      }
    | {
          token_tree_type: 'Token';
          data: Loc<Token>;
      };

export type Token =
    | {
          token_type: 'Open' | 'Close';
          data: [string, GroupType];
      }
    | {
          token_type: 'Delim';
          data: [string, 'Comma' | 'Semi'];
      }
    | {
          token_type: 'Literal';
          data: [
              string,
              (
                  | 'Null'
                  | 'Unit'
                  | 'Bool'
                  | 'Nat8'
                  | 'Nat16'
                  | 'Nat32'
                  | 'Nat64'
                  | 'Int'
                  | 'Int8'
                  | 'Int16'
                  | 'Int32'
                  | 'Int64'
                  | 'Float'
                  | 'Text'
                  | 'Char'
                  | 'Principal'
              ),
          ];
      }
    | {
          token_type:
              | 'LineComment'
              | 'Dot'
              | 'Colon'
              | 'Assign'
              | 'Operator'
              | 'Ident'
              | 'Wild'
              | 'Space'
              | 'Line'
              | 'MultiLine'
              | 'Unknown';
          data: string;
      };

export type Source = {
    line: number;
    col: number;
    span: [number, number];
};

export default function parse(
    text: string,
    parsers: object,
    options: object,
): TokenTree {
    let tt = wasm.parse_token_tree(text.trim());

    // console.log(tt);

    return tt;
}
