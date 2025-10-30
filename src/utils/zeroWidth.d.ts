export interface CharConfig {
    actualUnicodeChar: string;
    aka: string;
    code: string;
    codeEscaped: string;
    escapeChar: string;
    name: string;
    type: string;
    url: string;
    htmlcode?: string;
    htmlentity?: string;
    csscode?: string;
    unicode?: string;
    replaceWith?: string;
}

export const data: CharConfig[];
