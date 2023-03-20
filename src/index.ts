import { escapeLiteral, regexAsString, buildRegex, checkProp, asArray } from "./util";

export interface Token {
  type: string;
  value: string;
  data?: {
    [key: string]: string;
  };
  children?: Token[];
  [key: string]: any;
}

export type TokenProcessor = (token: Token) => Token;
const defaultProcessor: TokenProcessor = (token) => token;

export type DefinitionProps = {
  type: string;
  regexFlags?: string;
  validFlags?: string;

  deep?: boolean;
  skip?: boolean;
  wordBoundary?: boolean;

  process?: TokenProcessor;
} & (
  | {
      literal: string | string[];
      regex?: never;
    }
  | {
      literal?: never;
      regex: RegExp | string | (RegExp | string)[];
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

  readonly process: TokenProcessor;

  constructor(definition: DefinitionProps) {
    let { regex, literal, valid, nextValid, regexFlags, validFlags } = definition;

    if (!literal && !regex) throw new Error("Must define literal or regex");
    if (literal && regex) throw new Error("Can only define one of literal or regex");
    if (valid && nextValid) throw new Error("Can only define one of valid or nextValid");

    if (!checkProp(literal)) throw new Error("Definition literal cannot be empty");
    if (!checkProp(regex)) throw new Error("Definition regex cannot be empty");
    if (!checkProp(valid)) throw new Error("Definition valid cannot be empty");
    if (!checkProp(nextValid)) throw new Error("Definition nextValid cannot be empty");

    this.type = definition.type;
    this.wordBoundary = definition.wordBoundary ?? true;
    this.deep = definition.deep ?? false;
    this.skip = definition.skip ?? false;
    this.process = definition.process ?? defaultProcessor;

    // regex ??= asArray(literal!).map(escapeLiteral);
    const execArray = regex ? asArray(regex).map(regexAsString) : asArray(literal!).map(escapeLiteral);
    const execStringArrayRegex = execArray.join("|");
    const execStringRegex = this.wordBoundary ? `(\\b(${execStringArrayRegex})\\b)` : `(${execStringArrayRegex})`;

    const testStringRegex = valid
      ? regexAsString(valid)
      : nextValid
      ? `${execStringRegex}${regexAsString(nextValid)}`
      : execStringRegex;

    this.execRegex = buildRegex(execStringRegex, regexFlags);
    this.testRegex = buildRegex(testStringRegex, validFlags ?? regexFlags);

    this.stringRegex = execStringRegex;
    this.stringValid = testStringRegex;
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

export type Tokenizer = (input: string, process?: TokenProcessor) => Token[];

export function definition(definition: DefinitionProps | (() => DefinitionProps)): Definition {
  if (typeof definition === "function") definition = definition();
  return new Definition(definition);
}

export function lexer(definitions: Definition[], lexerProcessor: TokenProcessor = defaultProcessor): Tokenizer {
  let parentDefinition: Definition | null = null;
  let usedDefinitions: Map<Definition, string> = new Map();

  if (!definitions.length) throw new Error("No definitions provided");

  const tokenizer: Tokenizer = (input: string, tokenizerProcessor: TokenProcessor = defaultProcessor) => {
    let rest = input;
    let tokens: any = [];

    const validDefinitions = parentDefinition
      ? definitions.filter((definition) => definition != parentDefinition)
      : definitions;

    do {
      const definition = validDefinitions.find((definition) => definition.test(rest));
      if (!definition) throw new Error(`No definition matched for "${rest}"`);

      const match = definition.exec(rest);
      if (!match) throw new Error(`No value matched for "${rest}"`);

      const value = match.groups?.value ?? match[0];
      rest = rest.slice(match[0].length);

      if (usedDefinitions.has(definition) && usedDefinitions.get(definition) === value) {
        const keys = [...usedDefinitions.keys()].map((d) => d.type);
        throw new Error(`Infinite loop detected for "${value}": ${keys.join(" -> ")}`);
      }

      if (definition.skip) continue;

      const groups = match.groups ?? {};
      delete groups.value;

      let token: Token = {
        type: definition.type,
        value: value,
      };

      if (Object.keys(groups).length) token.data = groups;

      if (definition.deep) {
        usedDefinitions.set(definition, value);
        parentDefinition = definition;

        token.children = tokenizer(value);

        parentDefinition = null;
        usedDefinitions.delete(definition);
      }

      token = definition.process(token);
      token = tokenizerProcessor(token);
      token = lexerProcessor(token);

      tokens.push(token);
    } while (rest.length);

    return tokens;
  };

  return tokenizer;
}
