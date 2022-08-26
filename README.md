# Motoko Formatter

> ### A [Prettier](https://prettier.io/) plugin for the [Motoko](https://internetcomputer.org/docs/current/developer-docs/build/cdks/motoko-dfinity/motoko/) programming language.

---

## Setup

After making sure [Node.js](https://nodejs.org/en/download/) is installed on your local machine, run the following command in your Motoko project directory:

```sh
npm install --save-dev prettier prettier-plugin-motoko
```

## Command-line usage

Format your Motoko files using the [Prettier CLI](https://prettier.io/docs/en/cli.html):

```sh
npm exec prettier -- --write **/*.mo
```

Check if your Motoko files are correctly formatted:

```sh
npm exec prettier -- --check **/*.mo
```

## VS Code support

- Works out of the box with the [Motoko extension](https://marketplace.visualstudio.com/items?itemName=dfinity-foundation.vscode-motoko).
- Also compatible with the the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).

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
