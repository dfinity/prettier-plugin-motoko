import { useEffect, useState } from 'react';
import './App.css';

import { format, Plugin } from 'prettier';
import * as motokoPlugin from 'prettier-plugin-motoko/src/environments/web';

const source = `
let a={b};
1+2
`;

function App() {
    const [formatted, setFormatted] = useState<string>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        (async () => {
            const formatted = await format(source, {
                plugins: [motokoPlugin],
                filepath: '*.mo',
            });
            setFormatted(formatted);
        })().catch((error) => setError(String(error)));
    });

    return (
        <div className="App">
            <pre>{formatted}</pre>
            {!!error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
    );
}

export default App;
