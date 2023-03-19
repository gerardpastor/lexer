export interface Token {
  type: string;
  value: string;
  data: {
    [key: string]: string;
  };
  children?: Token[];
}

export type ProcessFn = (token: Token) => Token;
const defaultProcess: ProcessFn = (token) => token;

const escapeRegex = (regex?: string) =>
  regex?.replace(new RegExp("[\\-\\[\\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\^\\$\\|]", "g"), "\\$&") ?? "";

const buildRegex = (regex: string, flags?: string) => {
  if (/^\(*\^/g.test(regex)) throw new Error(`Regex cannot start with ^: "${regex}"`);
  // const escaped =
  return new RegExp("^" + regex, (flags ?? "").replace("g", ""));
};

export type DefinitionProps = {
  type: string;
  valid?: RegExp | string;
  validFlags?: string;

  deep?: boolean;
  skip?: boolean;

  process?: ProcessFn;
} & (
  | {
      value: string;
      values?: never;
      regex?: never;
      regexFlags?: never;
    }
  | {
      value?: never;
      values: string[];
      regex?: never;
      regexFlags?: never;
    }
  | {
      value?: never;
      values?: never;
      regex: RegExp | string;
      regexFlags?: string;
    }
);

class Definition {
  readonly type: string;

  readonly execRegex: RegExp;
  readonly testRegex: RegExp;

  readonly stringRegex: string;
  readonly stringValid: string;

  readonly deep: boolean;
  readonly skip: boolean;

  readonly process: ProcessFn;

  constructor(definition: DefinitionProps) {
    if (definition.value === "") throw new Error("Definition value cannot be empty");
    if (definition.values?.filter(Boolean).length === 0) throw new Error("Definition values cannot be empty");
    if (definition.regex === "") throw new Error("Definition regex cannot be empty");

    if (!definition.regex && !definition.values && !definition.value)
      throw new Error("Definition must define regex, values or value");

    if ([definition.regex, definition.values, definition.value].filter(Boolean).length > 1) {
      throw new Error("Can only define one of regex, values or value");
    }

    definition.regex ??= `(${(definition.values ?? [definition.value]).map(escapeRegex).join("|")})\\b`;
    definition.valid ??= definition.regex;
    definition.validFlags ??= definition.regexFlags;

    const stringRegex = `(${typeof definition.regex === "string" ? definition.regex : definition.regex.source})`;
    const stringValid = `(${typeof definition.valid === "string" ? definition.valid : definition.valid.source})`;

    const execRegex = buildRegex(stringRegex, definition.regexFlags);
    const testRegex = buildRegex(stringValid, definition.validFlags);

    this.type = definition.type;

    this.execRegex = execRegex;
    this.testRegex = testRegex;

    this.stringRegex = stringRegex;
    this.stringValid = stringValid;

    this.deep = definition.deep ?? false;
    this.skip = definition.skip ?? false;

    this.process = definition.process ?? defaultProcess;
  }

  exec(input: string) {
    return this.execRegex.exec(input);
  }

  test(input: string) {
    return this.testRegex.test(input);
  }

  toString() {
    return this.stringRegex;
  }
}

export type Tokenizer = (input: string, process?: ProcessFn) => Token[];

export function definition(definition: DefinitionProps | (() => DefinitionProps)): Definition {
  if (typeof definition === "function") definition = definition();
  return new Definition(definition);
}

export function lexer(definitions: Definition[], lexerProcess: ProcessFn = defaultProcess): Tokenizer {
  let ommitedDefnitons: Definition[] = [];

  if (!definitions.length) throw new Error("No definitions provided");

  const tokenizer = (input: string, tokenizerProcess: ProcessFn = defaultProcess) => {
    let rest = input;
    let tokens: any = [];

    const validDefinitions = definitions.filter((definition) => !ommitedDefnitons.includes(definition));

    do {
      const definition = validDefinitions.find((definition) => definition.test(rest));
      if (!definition) throw new Error(`No definition matched for "${rest}"`);

      const match = definition.exec(rest);
      if (!match) throw new Error(`No value matched for "${rest}"`);

      const value = match.groups?.value ?? match[0];
      rest = rest.slice(match[0].length);

      if (definition.skip) continue;

      const groups = match.groups ?? {};
      delete groups.value;

      let token: Token = {
        type: definition.type,
        value: value,
        data: groups,
      };

      if (definition.deep) {
        ommitedDefnitons.push(definition);
        token.children = tokenizer(value);
        ommitedDefnitons.pop();
      }

      token = definition.process(token);
      token = tokenizerProcess(token);
      token = lexerProcess(token);

      tokens.push(token);
    } while (rest.length);

    return tokens;
  };

  return tokenizer;
}
