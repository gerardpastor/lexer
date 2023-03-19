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

const regexAsString = (regex: string | RegExp) => (typeof regex === "string" ? regex : regex.source);
const buildRegex = (regex: string, flags?: string) => {
  if (/^\(*\^/g.test(regex)) throw new Error(`Regex cannot start with ^: "${regex}"`);
  // const escaped =
  return new RegExp("^" + regex, (flags ?? "").replace("g", ""));
};

export type DefinitionProps = {
  type: string;
  regexFlags?: string;
  validFlags?: string;

  deep?: boolean;
  skip?: boolean;
  wordBoundary?: boolean;

  process?: ProcessFn;
} & (
  | {
      value: string;
      values?: never;
      regex?: never;
      regexes?: never;
    }
  | {
      value?: never;
      values: string[];
      regex?: never;
      regexes?: never;
    }
  | {
      value?: never;
      values?: never;
      regex: RegExp | string;
      regexes?: never;
    }
  | {
      value?: never;
      values?: never;
      regex?: never;
      regexes: (RegExp | string)[];
    }
) &
  (
    | {
        valid?: never;
        nextValid?: never;
      }
    | {
        valid: RegExp | string;
        nextValid?: never;
      }
    | {
        valid?: never;
        nextValid: RegExp | string;
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

  readonly wordBoundary: boolean;

  readonly process: ProcessFn;

  constructor(definition: DefinitionProps) {
    // Validate props
    if (definition.value === "") throw new Error("Definition value cannot be empty");
    if (definition.values?.filter(Boolean).length === 0) throw new Error("Definition values cannot be empty");
    if (definition.regex === "") throw new Error("Definition regex cannot be empty");
    if (definition.regexes?.filter(Boolean).length === 0) throw new Error("Definition regexes cannot be empty");

    const regexInputs = [definition.regex, definition.regexes, definition.values, definition.value].filter(
      Boolean,
    ).length;
    if (regexInputs === 0) throw new Error("Definition must define regex, regexes, values or value");
    if (regexInputs > 1) throw new Error("Can only define one of regex, regexes, values or value");

    const validInputs = [definition.valid, definition.nextValid].filter(Boolean).length;
    if (validInputs > 1) throw new Error("Can only define one of valid or nextValid");

    // Format props
    if (definition.value) definition.value = escapeRegex(definition.value);
    if (definition.values) definition.values = definition.values.map(escapeRegex);
    if (definition.regexes) definition.regexes = definition.regexes.map(regexAsString).map((r) => `(${r})`);
    if (definition.regex) definition.regex = regexAsString(definition.regex);
    if (definition.valid) definition.valid = regexAsString(definition.valid);
    if (definition.nextValid) definition.nextValid = regexAsString(definition.nextValid);

    // definition.wordBoundary ??= !!(definition.value || definition.values);
    definition.wordBoundary ??= true;

    definition.regex ??= definition.regexes
      ? definition.regexes.join("|")
      : `(${(definition.values ?? [definition.value]).join("|")})`;

    definition.regex = definition.wordBoundary ? `${definition.regex}\\b` : definition.regex;

    const stringRegex = `(${regexAsString(definition.regex)})`;

    definition.valid ??= definition.nextValid ? `${stringRegex}(${definition.nextValid})` : definition.regex;
    definition.validFlags ??= definition.regexFlags;
    const stringValid = `(${regexAsString(definition.valid)})`;

    const execRegex = buildRegex(stringRegex, definition.regexFlags);
    const testRegex = buildRegex(stringValid, definition.validFlags);

    this.type = definition.type;

    this.execRegex = execRegex;
    this.testRegex = testRegex;

    this.stringRegex = stringRegex;
    this.stringValid = stringValid;

    this.wordBoundary = definition.wordBoundary;

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
