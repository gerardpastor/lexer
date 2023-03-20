# `lexer`

A simple typescript lexer.

## Installation

`pnpm add @gerardpastor/lexer`

`yarn add @gerardpastor/lexer`

`npm i @gerardpastor/lexer`

## Usage

```typescript
import { definition, lexer } from "../src/index";

const definitions = [
  definition({
    type: "word",
    regex: /([a-zA-Z0-9]+)/,
  }),
  definition({
    type: "number",
    regex: /([0-9]+)/,
  }),
  definition({
    type: "operator",
    literal: ["+", "-", "*", "/"],
    wordBoundary: false,
  }),
  definition({
    type: "parenthesis",
    literal: ["(", ")"],
    wordBoundary: false,
  }),
  definition({
    type: "whitespace",
    regex: /[ ]+/,
    skip: true,
    wordBoundary: false,
  }),
];

const tokenizer = lexer(definitions);
const tokens = tokenizer("1 + 2 * 3");

console.log(tokens);
// [
//   { type: 'number', value: '1', data: {} },
//   { type: 'operator', value: '+', data: {} },
//   { type: 'number', value: '2', data: {} },
//   { type: 'operator', value: '*', data: {} },
//   { type: 'number', value: '3', data: {} }
// ]
```
