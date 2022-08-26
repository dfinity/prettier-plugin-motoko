# Motoko Formatter

> ### A [Prettier](https://prettier.io/) plugin for the [Motoko](https://internetcomputer.org/docs/current/developer-docs/build/cdks/motoko-dfinity/motoko/) programming language.

---

## Basic Usage

After making sure [Node.js](https://nodejs.org/en/download/) is installed on your local machine, run the following command in your Motoko project directory:

```sh
npm install --save-dev prettier prettier-plugin-motoko
```

## Customization

Configure the formatter by creating a `.prettierrc` file. Learn more at [Prettier's config file documentation](https://prettier.io/docs/en/configuration.html)

### Example `.prettierrc` configuration with default values:

```json
{
    "bracketSpacing": true,
    "printWidth": 80,
    "tabWidth": 2,
    "trailingComma": "es5",
    "useTabs": false
}
```

## Multiple languages

Note that this configuration will be shared between Motoko, JavaScript, CSS, HTML, and any other languages supported by Prettier. 

You can specifically configure Motoko files using a [configuration override](https://prettier.io/docs/en/configuration.html#configuration-overrides) in your `.prettierrc` file:

```json
{
    "overrides": [{
        "files": "*.mo",
        "options": {
            "bracketSpacing": true
        }
    }]
}
```

## Usage in VS Code

- Works out of the box with the [Motoko VSCode extension](https://marketplace.visualstudio.com/items?itemName=dfinity-foundation.vscode-motoko).
- Compatible with the the [VS Code Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).

