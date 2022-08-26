# Motoko Formatter

#### [Work in progress!](https://github.com/dfinity/prettier-plugin-motoko/issues/1)

---

A [Prettier](https://prettier.io/) plugin for the [Motoko](https://internetcomputer.org/docs/current/developer-docs/build/cdks/motoko-dfinity/motoko/) programming language.

## Basic Usage

After making sure [Node.js](https://nodejs.org/en/download/) is installed on your local machine, run the following command in your Motoko project directory:

```sh
npm install --save-dev prettier prettier-plugin-motoko
```

To customize the formatter, create a file called `.prettierrc` file. Learn more at [Prettier's config file documentation](https://prettier.io/docs/en/configuration.html)

#### Default `.prettierrc` configuration:

```json
{
    "tabWidth": 2,
    "printWidth": 80,
    "useTabs": false,
    "bracketSpacing": true
}
```

### Usage in VS Code

- Works out of the box with the [Motoko VSCode extension](https://marketplace.visualstudio.com/items?itemName=dfinity-foundation.vscode-motoko).
- Compatible with the the [VS Code Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).

### Usage in JetBrains IDEs

- Compatible with the [IntelliJ Prettier extension](https://www.jetbrains.com/help/idea/prettier.html).
