import { useState } from 'react';
import reactLogo from './assets/react.svg';
import './App.css';

import prettier from 'prettier';
import * as motokoPlugin from 'prettier-plugin-motoko/src/environments/web';

const source = `
let a = {b}
`;

function App() {
    const formatted = prettier.format(source, {
        plugins: [motokoPlugin],
        filepath: '*.mo',
    });

    return (
        <div className="App">
            <pre>{formatted}</pre>
        </div>
    );
}

export default App;
