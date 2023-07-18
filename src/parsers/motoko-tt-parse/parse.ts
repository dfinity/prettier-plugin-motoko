import { ParserOptions } from 'prettier';
import wasm from '../../wasm';
import preprocess from './preprocess';

type Loc<T> = [T, Source];

export type GroupType =
    | 'Unenclosed'
    | 'Paren'
    | 'Curly'
    | 'Square'
    | 'Angle'
    | 'Comment';

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
              | 'BlockComment'
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
    options: ParserOptions<any>,
): TokenTree;
export default function parse(
    text: string,
    parsers: object,
    options: ParserOptions<any>,
): TokenTree;
export default function parse(
    text: string,
    parsers: object | ParserOptions<any>,
    options?: ParserOptions<any>,
): TokenTree {
    if (arguments.length === 2) {
        options = parsers as ParserOptions<any>;
    }

    text = preprocess(text, options);

    const tt = wasm.parse_token_tree(text.trim());
    // console.log(tt);
    return tt;
}
