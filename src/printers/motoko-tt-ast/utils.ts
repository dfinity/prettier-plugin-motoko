import { Doc } from 'prettier';

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
            case 'concat':
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
