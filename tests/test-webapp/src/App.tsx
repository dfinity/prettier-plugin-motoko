import { useEffect, useState } from 'react';
import reactLogo from './assets/react.svg';
import './App.css';

import { format } from 'prettier';
import * as motokoPlugin from 'prettier-plugin-motoko/src/environments/web';

const source = `
let a={b};
`;

function App() {
    const [formatted, setFormatted] = useState<string>();

    useEffect(() => {
        format(source, {
            plugins: [motokoPlugin],
            filepath: '*.mo',
        }).then(setFormatted);
    });

    return (
        <div className="App">
            <pre>{formatted}</pre>
        </div>
    );
}

export default App;
