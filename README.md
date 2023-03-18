# `lexer`

A simple typescript lexer.

## Installation

`pnpm add @gerardpastor/lexer`

`yarn add @gerardpastor/lexer`

`npm i @gerardpastor/lexer`

## Usage

```typescript
import { Lexer, definition } from "lexer";


const definitions = [
  definition({
    type: "whitespace",
    value: " ",
    skip: true,
  }),
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
    values: ["+", "-", "*", "/"],
  }),
  definition({
    type: "parenthesis",
    values: ["(", ")"],
  }),
];

const tokenizer = lexer(definitions);
const tokens = tokenizer("1 + 2 * 3");

// [
//   { type: 'number', value: '1', data: {} },
//   { type: 'whitespace', value: ' ', data: {} },
//   { type: 'operator', value: '+', data: {} },
//   { type: 'whitespace', value: ' ', data: {} },
//   { type: 'number', value: '2', data: {} },
//   { type: 'whitespace', value: ' ', data: {} },
//   { type: 'operator', value: '*', data: {} },
//   { type: 'whitespace', value: ' ', data: {} },
//   { type: 'number', value: '3', data: {} }
// ]
```
