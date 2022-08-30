# mo-fmt &middot; [![npm version](https://img.shields.io/npm/v/prettier-plugin-motoko.svg?logo=npm)](https://www.npmjs.com/package/prettier-plugin-motoko) [![GitHub license](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

> #### An easy-to-use Motoko formatter command.

---

## Setup

If you have [Node.js](https://nodejs.org/en/download/) installed on your system:

```bash
npm install -g mo-fmt
```

If you don't want to install Node.js, you can also download a portable executable from the [GitHub releases](https://github.com/dfinity/prettier-plugin-motoko/releases) page.

This command is also available using [npx](https://docs.npmjs.com/cli/v7/commands/npx), e.g. `npx mo-fmt ...`.

## Usage

```bash
# Format `**/*.mo` in-place
mo-fmt

# Format `File.mo` in-place
mo-fmt Main.mo

# Format `Main.mo` and all `*.mo` files in the `lib/` directory
mo-fmt Main.mo lib/*.mo

# Check that all files are formatted
mo-fmt -c

# Quick reference
mo-fmt --help
```
