import prettier from 'prettier';
import motokoPlugin from '../src';

describe('Motoko formatter', () => {
    test('works', () => {
        let result = prettier.format('let/*{{*/x = 0; //\n x', {
            filepath: 'Main.mo',
            plugins: [motokoPlugin],
        });

        expect(result).toStrictEqual('let /*{{*/x = 0; //\nx');
    });
});
