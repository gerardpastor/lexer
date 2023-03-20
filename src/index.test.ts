import { describe, it, vi } from "vitest";
import { lexer, definition, Token } from "./index";
import { escapeLiteral, regexAsString, buildRegex, checkProp, asArray } from "./util";

describe("Utils", () => {
  it.concurrent("Should check props correctly", async ({ expect }) => {
    expect(checkProp(undefined)).toBe(true);

    expect(checkProp("")).toBe(false);
    expect(checkProp("string")).toBe(true);
    expect(checkProp(new RegExp(""))).toBe(false);
    expect(checkProp(/.*/)).toBe(true);

    expect(checkProp([])).toBe(false);
    expect(checkProp([""])).toBe(false);
    expect(checkProp(["string"])).toBe(true);
    expect(checkProp([new RegExp("")])).toBe(false);
    expect(checkProp([/.*/])).toBe(true);
  });

  it.concurrent("Should parse regex as string correctly", async ({ expect }) => {
    expect(regexAsString("string")).toStrictEqual("string");
    expect(regexAsString(/.*/)).toStrictEqual(".*");
    expect(regexAsString(/(?<value>.*)/)).toStrictEqual("(?<value>.*)");
    expect(regexAsString(".*")).toStrictEqual(".*");
    expect(regexAsString("(?<value>.*)")).toStrictEqual("(?<value>.*)");
  });

  it.concurrent("Should build regex correctly", async ({ expect }) => {
    expect(buildRegex("string")).toStrictEqual(/^string/);
    expect(buildRegex(".*")).toStrictEqual(/^.*/);
    expect(buildRegex("(?<value>.*)")).toStrictEqual(/^(?<value>.*)/);

    expect(buildRegex("string", "i")).toStrictEqual(/^string/i);
    expect(buildRegex(".*", "i")).toStrictEqual(/^.*/i);
    expect(buildRegex("(?<value>.*)", "i")).toStrictEqual(/^(?<value>.*)/i);

    expect(buildRegex("string", "g")).toStrictEqual(/^string/);
    expect(buildRegex(".*", "g")).toStrictEqual(/^.*/);
    expect(buildRegex("(?<value>.*)", "g")).toStrictEqual(/^(?<value>.*)/);
  });

  it.concurrent("Should escape literal correctly", async ({ expect }) => {
    expect(escapeLiteral("string")).toStrictEqual("string");
    expect(escapeLiteral("-[]/{}()*+?.\\^$|")).toStrictEqual("\\-\\[\\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|");
  });

  it.concurrent("Should return value as array", async ({ expect }) => {
    expect(asArray("value")).toStrictEqual(["value"]);
    expect(asArray(["value"])).toStrictEqual(["value"]);
    expect(asArray([])).toStrictEqual([]);

    expect(asArray(/regex/)).toStrictEqual([/regex/]);
    expect(asArray([/regex/])).toStrictEqual([/regex/]);
    expect(asArray([])).toStrictEqual([]);
  });
});

describe("Definitions", () => {
  it.concurrent("can provide object or funcion", async ({ expect }) => {
    expect(definition({ type: "mock", regex: ".*" }).execRegex).toEqual(/^(\b(.*)\b)/);
    expect(definition(() => ({ type: "mock", regex: /.*/ })).execRegex).toEqual(/^(\b(.*)\b)/);
  });

  it.concurrent("regexes are encapsulated", async ({ expect }) => {
    expect(definition({ type: "mock", regex: ".*" }).execRegex).toEqual(/^(\b(.*)\b)/);
    expect(definition({ type: "mock", regex: /.*/ }).execRegex).toEqual(/^(\b(.*)\b)/);
  });

  it.concurrent("can provide a single literal", async ({ expect }) => {
    expect(definition({ type: "mock", literal: "value" }).execRegex).toEqual(/^(\b(value)\b)/);
  });

  it.concurrent("can provide an array of literals", async ({ expect }) => {
    expect(definition({ type: "mock", literal: ["AA", "BB", "CC"] }).execRegex).toEqual(/^(\b(AA|BB|CC)\b)/);
  });

  it.concurrent("can provide a single regex", async ({ expect }) => {
    expect(definition({ type: "mock", regex: ".*" }).execRegex).toEqual(/^(\b(.*)\b)/);
    expect(definition({ type: "mock", regex: /.*/ }).execRegex).toEqual(/^(\b(.*)\b)/);
  });

  it.concurrent("can provide an array of regexes", async ({ expect }) => {
    expect(definition({ type: "mock", regex: ["A+", /B+/] }).execRegex).toEqual(/^(\b(A+|B+)\b)/);
  });

  it.concurrent("execution regexes are generated correctly", async ({ expect }) => {
    expect(definition({ type: "mock", regex: ".*" }).execRegex).toEqual(/^(\b(.*)\b)/);
    expect(definition({ type: "mock", regex: /.*/ }).execRegex).toEqual(/^(\b(.*)\b)/);
    expect(definition({ type: "mock", regex: [".*"] }).execRegex).toEqual(/^(\b(.*)\b)/);
    expect(definition({ type: "mock", regex: [/.*/] }).execRegex).toEqual(/^(\b(.*)\b)/);
    expect(definition({ type: "mock", literal: "literal" }).execRegex).toEqual(/^(\b(literal)\b)/);
    expect(definition({ type: "mock", literal: ["value1", "value2"] }).execRegex).toEqual(/^(\b(value1|value2)\b)/);
  });

  it.concurrent("must use regex as a validation function by default", async ({ expect }) => {
    expect(definition({ type: "mock", regex: ".*" }).testRegex).toEqual(/^(\b(.*)\b)/);
    expect(definition({ type: "mock", regex: /.*/ }).testRegex).toEqual(/^(\b(.*)\b)/);
    expect(definition({ type: "mock", regex: [".*"] }).testRegex).toEqual(/^(\b(.*)\b)/);
    expect(definition({ type: "mock", regex: [/.*/] }).testRegex).toEqual(/^(\b(.*)\b)/);
    expect(definition({ type: "mock", literal: "literal" }).testRegex).toEqual(/^(\b(literal)\b)/);
    expect(definition({ type: "mock", literal: ["value1", "value2"] }).testRegex).toEqual(/^(\b(value1|value2)\b)/);
  });

  it.concurrent("can provide a validation regex", async ({ expect }) => {
    const base = { type: "mock" };

    expect(definition({ ...base, regex: ".*", valid: "[^ ]+" }).testRegex).toEqual(/^[^ ]+/);
    expect(definition({ ...base, regex: /.*/, valid: "[^ ]+" }).testRegex).toEqual(/^[^ ]+/);
    expect(definition({ ...base, regex: [".*"], valid: "[^ ]+" }).testRegex).toEqual(/^[^ ]+/);
    expect(definition({ ...base, regex: [/.*/], valid: "[^ ]+" }).testRegex).toEqual(/^[^ ]+/);
    expect(definition({ ...base, literal: ".*", valid: "[^ ]+" }).testRegex).toEqual(/^[^ ]+/);
    expect(definition({ ...base, literal: [".*"], valid: "[^ ]+" }).testRegex).toEqual(/^[^ ]+/);

    expect(definition({ ...base, regex: ".*", valid: /[^ ]+/ }).testRegex).toEqual(/^[^ ]+/);
    expect(definition({ ...base, regex: /.*/, valid: /[^ ]+/ }).testRegex).toEqual(/^[^ ]+/);
    expect(definition({ ...base, regex: [".*"], valid: /[^ ]+/ }).testRegex).toEqual(/^[^ ]+/);
    expect(definition({ ...base, regex: [/.*/], valid: /[^ ]+/ }).testRegex).toEqual(/^[^ ]+/);
    expect(definition({ ...base, literal: ".*", valid: /[^ ]+/ }).testRegex).toEqual(/^[^ ]+/);
    expect(definition({ ...base, literal: [".*"], valid: /[^ ]+/ }).testRegex).toEqual(/^[^ ]+/);
  });

  it.concurrent("can provide a next validation regex", async ({ expect }) => {
    const base = { type: "mock" };

    expect(definition({ ...base, regex: ".*", nextValid: "[^ ]+" }).testRegex).toEqual(/^(\b(.*)\b)[^ ]+/);
    expect(definition({ ...base, regex: /.*/, nextValid: "[^ ]+" }).testRegex).toEqual(/^(\b(.*)\b)[^ ]+/);
    expect(definition({ ...base, regex: [".*"], nextValid: "[^ ]+" }).testRegex).toEqual(/^(\b(.*)\b)[^ ]+/);
    expect(definition({ ...base, regex: [/.*/], nextValid: "[^ ]+" }).testRegex).toEqual(/^(\b(.*)\b)[^ ]+/);
    expect(definition({ ...base, literal: ".*", nextValid: "[^ ]+" }).testRegex).toEqual(/^(\b(\.\*)\b)[^ ]+/);
    expect(definition({ ...base, literal: [".*"], nextValid: "[^ ]+" }).testRegex).toEqual(/^(\b(\.\*)\b)[^ ]+/);

    expect(definition({ ...base, regex: ".*", nextValid: /[^ ]+/ }).testRegex).toEqual(/^(\b(.*)\b)[^ ]+/);
    expect(definition({ ...base, regex: /.*/, nextValid: /[^ ]+/ }).testRegex).toEqual(/^(\b(.*)\b)[^ ]+/);
    expect(definition({ ...base, regex: [".*"], nextValid: /[^ ]+/ }).testRegex).toEqual(/^(\b(.*)\b)[^ ]+/);
    expect(definition({ ...base, regex: [/.*/], nextValid: /[^ ]+/ }).testRegex).toEqual(/^(\b(.*)\b)[^ ]+/);
    expect(definition({ ...base, literal: ".*", nextValid: /[^ ]+/ }).testRegex).toEqual(/^(\b(\.\*)\b)[^ ]+/);
    expect(definition({ ...base, literal: [".*"], nextValid: /[^ ]+/ }).testRegex).toEqual(/^(\b(\.\*)\b)[^ ]+/);
  });

  it.concurrent("literals are escaped", async ({ expect }) => {
    const raw = "-[]/{}()*+?.\\^$|";
    const escaped = /^(\b(\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|)\b)/;

    expect(definition({ type: "mock", literal: raw }).execRegex).toEqual(escaped);
    expect(definition({ type: "mock", literal: [raw] }).execRegex).toEqual(escaped);

    expect(definition({ type: "mock", regex: ".?" }).execRegex).toEqual(/^(\b(.?)\b)/);
    expect(definition({ type: "mock", regex: /.?/ }).execRegex).toEqual(/^(\b(.?)\b)/);
    expect(definition({ type: "mock", regex: [".?"] }).execRegex).toEqual(/^(\b(.?)\b)/);
    expect(definition({ type: "mock", regex: [/.?/] }).execRegex).toEqual(/^(\b(.?)\b)/);
    expect(definition({ type: "mock", literal: ".?" }).execRegex).toEqual(/^(\b(\.\?)\b)/);
    expect(definition({ type: "mock", literal: [".?"] }).execRegex).toEqual(/^(\b(\.\?)\b)/);
  });

  it.concurrent("can disable word boundary", async ({ expect }) => {
    const base = { type: "mock", wordBoundary: false };

    expect(definition({ ...base, regex: ".*" }).execRegex).toEqual(/^(.*)/);
    expect(definition({ ...base, regex: /.*/ }).execRegex).toEqual(/^(.*)/);
    expect(definition({ ...base, regex: [".*"] }).execRegex).toEqual(/^(.*)/);
    expect(definition({ ...base, regex: [/.*/] }).execRegex).toEqual(/^(.*)/);
    expect(definition({ ...base, literal: ".*" }).execRegex).toEqual(/^(\.\*)/);
    expect(definition({ ...base, literal: [".*"] }).execRegex).toEqual(/^(\.\*)/);

    expect(definition({ ...base, regex: ".*", nextValid: /[^ ]+/ }).testRegex).toEqual(/^(.*)[^ ]+/);
    expect(definition({ ...base, regex: /.*/, nextValid: /[^ ]+/ }).testRegex).toEqual(/^(.*)[^ ]+/);
    expect(definition({ ...base, regex: [".*"], nextValid: /[^ ]+/ }).testRegex).toEqual(/^(.*)[^ ]+/);
    expect(definition({ ...base, regex: [/.*/], nextValid: /[^ ]+/ }).testRegex).toEqual(/^(.*)[^ ]+/);
    expect(definition({ ...base, literal: ".*", nextValid: /[^ ]+/ }).testRegex).toEqual(/^(\.\*)[^ ]+/);
    expect(definition({ ...base, literal: [".*"], nextValid: /[^ ]+/ }).testRegex).toEqual(/^(\.\*)[^ ]+/);
  });

  it.concurrent("can provide custom exec regex flags", async ({ expect }) => {
    const base = { type: "mock" };

    expect(definition({ ...base, regex: ".*", regexFlags: "i" }).execRegex.flags).toEqual("i");
    expect(definition({ ...base, regex: /.*/, regexFlags: "i" }).execRegex.flags).toEqual("i");
    expect(definition({ ...base, regex: /.*/i }).execRegex.flags).toEqual("");
    expect(definition({ ...base, regex: /.*/m, regexFlags: "i" }).execRegex.flags).toEqual("i");

    expect(definition({ ...base, regex: ".*", regexFlags: "i" }).testRegex.flags).toEqual("i");
    expect(definition({ ...base, regex: /.*/, regexFlags: "i" }).testRegex.flags).toEqual("i");
    expect(definition({ ...base, regex: /.*/i }).testRegex.flags).toEqual("");
    expect(definition({ ...base, regex: /.*/m, regexFlags: "i" }).testRegex.flags).toEqual("i");
  });

  it.concurrent("can provide custom test regex flags", async ({ expect }) => {
    const base = { type: "mock", regex: /.*/ };

    expect(definition({ ...base, valid: ".*", validFlags: "u" }).testRegex.flags).toEqual("u");
    expect(definition({ ...base, valid: /.*/, validFlags: "u" }).testRegex.flags).toEqual("u");
    expect(definition({ ...base, valid: /.*/m, validFlags: "u" }).testRegex.flags).toEqual("u");
    expect(definition({ ...base, valid: /.*/u }).testRegex.flags).toEqual("");

    expect(definition({ ...base, regexFlags: "i", valid: ".*", validFlags: "u" }).testRegex.flags).toEqual("u");
    expect(definition({ ...base, regexFlags: "i", valid: /.*/, validFlags: "u" }).testRegex.flags).toEqual("u");
    expect(definition({ ...base, regexFlags: "i", valid: /.*/m, validFlags: "u" }).testRegex.flags).toEqual("u");
    expect(definition({ ...base, regexFlags: "i", valid: /.*/u }).testRegex.flags).toEqual("i");
  });

  it.concurrent('cannot provide "g" regex flag', async ({ expect }) => {
    const base = { type: "mock", regex: /.*/ };

    expect(definition({ ...base, regex: ".*", regexFlags: "g" }).execRegex.flags).not.contains("g");
    expect(definition({ ...base, regex: /.*/, regexFlags: "g" }).execRegex.flags).not.contains("g");
    expect(definition({ ...base, regex: /.*/g }).execRegex.flags).not.contains("g");
    expect(definition({ ...base, regex: /.*/gi }).execRegex.flags).not.contains("g");
    expect(definition({ ...base, regex: /.*/m, regexFlags: "g" }).execRegex.flags).not.contains("g");
    expect(definition({ ...base, regex: /.*/m, regexFlags: "gi" }).execRegex.flags).not.contains("g");

    expect(definition({ ...base, regex: ".*", regexFlags: "g" }).testRegex.flags).not.contains("g");
    expect(definition({ ...base, regex: /.*/, regexFlags: "g" }).testRegex.flags).not.contains("g");
    expect(definition({ ...base, regex: /.*/g }).testRegex.flags).not.contains("g");
    expect(definition({ ...base, regex: /.*/gi }).testRegex.flags).not.contains("g");
    expect(definition({ ...base, regex: /.*/m, regexFlags: "g" }).testRegex.flags).not.contains("g");
    expect(definition({ ...base, regex: /.*/m, regexFlags: "gi" }).testRegex.flags).not.contains("g");

    expect(definition({ ...base, valid: ".*", validFlags: "g" }).testRegex.flags).not.contains("g");
    expect(definition({ ...base, valid: /.*/, validFlags: "g" }).testRegex.flags).not.contains("g");
    expect(definition({ ...base, valid: /.*/g }).testRegex.flags).not.contains("g");
    expect(definition({ ...base, valid: /.*/gu }).testRegex.flags).not.contains("g");
    expect(definition({ ...base, valid: /.*/m, validFlags: "g" }).testRegex.flags).not.contains("g");
    expect(definition({ ...base, valid: /.*/m, validFlags: "gu" }).testRegex.flags).not.contains("g");

    expect(definition({ ...base, regexFlags: "i", valid: ".*", validFlags: "u" }).testRegex.flags).not.contains("g");
    expect(definition({ ...base, regexFlags: "i", valid: /.*/, validFlags: "u" }).testRegex.flags).not.contains("g");
    expect(definition({ ...base, regexFlags: "i", valid: /.*/g }).testRegex.flags).not.contains("g");
    expect(definition({ ...base, regexFlags: "i", valid: /.*/gu }).testRegex.flags).not.contains("g");
    expect(definition({ ...base, regexFlags: "i", valid: /.*/m, validFlags: "g" }).testRegex.flags).not.contains("g");
    expect(definition({ ...base, regexFlags: "i", valid: /.*/m, validFlags: "gu" }).testRegex.flags).not.contains("g");
  });

  it.concurrent("must throw an error if no valid props are provided", async ({ expect }) => {
    expect(() => definition({ type: "mock", literal: "" })).toThrow();
    expect(() => definition({ type: "mock", literal: [] })).toThrow();
    expect(() => definition({ type: "mock", literal: ["", ""] })).toThrow();
    expect(() => definition({ type: "mock", regex: "" })).toThrow();
    expect(() => definition({ type: "mock", regex: new RegExp("") })).toThrow();
    expect(() => definition({ type: "mock", regex: /.*/, valid: "" })).toThrow();
    expect(() => definition({ type: "mock", regex: /.*/, valid: new RegExp("") })).toThrow();
    expect(() => definition({ type: "mock", regex: /.*/, nextValid: "" })).toThrow();
    expect(() => definition({ type: "mock", regex: /.*/, nextValid: new RegExp("") })).toThrow();

    expect(() => definition({ type: "mock" } as any)).toThrow();
    expect(() => definition({ type: "mock", regex: /.*/, literal: "value" } as any)).toThrow();
    expect(() => definition({ type: "mock", regex: /.*/, literal: ["value"] } as any)).toThrow();
    expect(() => definition({ type: "mock", regex: [/.*/], literal: "value" } as any)).toThrow();
    expect(() => definition({ type: "mock", regex: [/.*/], literal: ["value"] } as any)).toThrow();
    expect(() => definition({ type: "mock", regex: /.*/, valid: /.*/, nextValid: /.*/ } as any)).toThrow();
  });
});

describe("Lexer", () => {
  it.concurrent("must generate callable tokanizer", async ({ expect }) => {
    const def = definition({ type: "mock", regex: ".*" });
    const tokenize = lexer([def]);

    expect(tokenize).toBeTypeOf("function");
  });

  it.concurrent("must throw an error if no definitions are provided", async ({ expect }) => {
    expect(() => lexer([])).toThrow();
  });
});

describe("Tokenizer", () => {
  const spaceDef = definition({ type: "space", regex: /[ ]+/, wordBoundary: false });

  it.concurrent("can tokenize a string", async ({ expect }) => {
    const def = definition({ type: "mock", regex: ".*" });
    const tokenize = lexer([def]);
    expect(tokenize("hello")).toEqual([{ type: "mock", value: "hello" }]);
  });

  it.concurrent("can tokenize a string with multiple definitions", async ({ expect }) => {
    const wordDef = definition({ type: "word", regex: /[^ ]+/ });
    const tokenize = lexer([wordDef, spaceDef]);
    expect(tokenize("hello")).toEqual([{ type: "word", value: "hello" }]);
  });

  it.concurrent("can tokenize a string with multiple definitions and multiple matches", async ({ expect }) => {
    const wordDef = definition({ type: "word", regex: /[^ ]+/ });
    const tokenize = lexer([wordDef, spaceDef]);
    expect(tokenize("hello world")).toEqual([
      { type: "word", value: "hello" },
      { type: "space", value: " " },
      { type: "word", value: "world" },
    ]);
  });

  it.concurrent('can tokenize a string using "literal" prop', async ({ expect }) => {
    const helloDef = definition({ type: "mock", literal: "hello" });
    const wordDef = definition({ type: "word", regex: /[^ ]+/ });
    const tokenize = lexer([helloDef, wordDef, spaceDef]);
    expect(tokenize("hello world")).toEqual([
      { type: "mock", value: "hello" },
      { type: "space", value: " " },
      { type: "word", value: "world" },
    ]);
  });

  it.concurrent("can tokenize a string using literal array prop", async ({ expect }) => {
    const mockDef = definition({ type: "mock", literal: ["hello", "world"] });
    const tokenize = lexer([mockDef, spaceDef]);
    expect(tokenize("hello world")).toEqual([
      { type: "mock", value: "hello" },
      { type: "space", value: " " },
      { type: "mock", value: "world" },
    ]);
  });

  it.concurrent("must throw an error if no definition matches", async ({ expect }) => {
    const mockDef = definition({ type: "mock", regex: /[ ]+/ });
    const tokenize = lexer([mockDef]);
    expect(() => tokenize("mock")).toThrow('No definition matched for "mock"');
  });

  it.concurrent("must throw an error if regex not matches with a passed test", async ({ expect }) => {
    const mockDef = definition({ type: "mock", regex: /[ ]+/, valid: /[^ ]+/ });
    const tokenize = lexer([mockDef]);
    expect(() => tokenize("mock")).toThrow('No value matched for "mock"');
  });

  it.concurrent("con tokenize definitions with same type but different regex", async ({ expect }) => {
    const wordDef = definition({ type: "token", regex: /[^ ]+/ });
    const spaceDef = definition({ type: "token", regex: /[ ]+/, wordBoundary: false });
    const tokenize = lexer([wordDef, spaceDef]);
    expect(tokenize("hello world")).toEqual([
      { type: "token", value: "hello" },
      { type: "token", value: " " },
      { type: "token", value: "world" },
    ]);
  });

  it.concurrent("definitions with equal regex must match the first one", async ({ expect }) => {
    const mock1Def = definition({ type: "mock1", regex: /[^ ]+/ });
    const mock2Def = definition({ type: "mock2", regex: /[^ ]+/ });
    const tokenize = lexer([mock1Def, mock2Def]);
    expect(tokenize("mock")).toEqual([{ type: "mock1", value: "mock" }]);
  });

  it.concurrent("definitions with equal regex start must match the first one", async ({ expect }) => {
    const mock1Def = definition({ type: "mock1", regex: /[^ ]+/ });
    const mock2Def = definition({ type: "mock2", regex: /[^ ]ock/ });
    const tokenize = lexer([mock1Def, mock2Def]);
    expect(tokenize("mock")).toEqual([{ type: "mock1", value: "mock" }]);
  });

  it.concurrent("definitions with equal regex start must match the first one", async ({ expect }) => {
    const mock1Def = definition({ type: "mock1", regex: /[^ ]/, wordBoundary: false });
    const mock2Def = definition({ type: "mock2", regex: /[^ ]ock/ });
    const tokenize = lexer([mock1Def, mock2Def]);
    expect(tokenize("mock")[0]).toEqual({ type: "mock1", value: "m" });
  });

  it.concurrent('definitions with "skip" property must be skipped', async ({ expect }) => {
    const wordDef = definition({ type: "word", regex: /[^ ]+/ });
    const spaceDef = definition({ type: "space", regex: /[ ]+/, skip: true, wordBoundary: false });
    const tokenize = lexer([wordDef, spaceDef]);
    expect(tokenize("hello world")).toEqual([
      { type: "word", value: "hello" },
      { type: "word", value: "world" },
    ]);
  });

  it.concurrent("can tokenize a string with extra data", async ({ expect }) => {
    const groupDef = definition({ type: "group", regex: /the (?<adjective>[^ ]+) (?<animal>(fox|dog)+)/ });
    const wordDef = definition({ type: "word", regex: /[^ ]+/ });
    const tokenize = lexer([groupDef, wordDef, spaceDef]);
    expect(tokenize("the quick fox jumps over the lazy dog")).toEqual([
      { type: "group", value: "the quick fox", data: { adjective: "quick", animal: "fox" } },
      { type: "space", value: " " },
      { type: "word", value: "jumps" },
      { type: "space", value: " " },
      { type: "word", value: "over" },
      { type: "space", value: " " },
      { type: "group", value: "the lazy dog", data: { adjective: "lazy", animal: "dog" } },
    ]);
  });

  it.concurrent("can tokenize a string with custom value portion", async ({ expect }) => {
    const groupDef = definition({
      type: "group",
      regex: /(?<article>(the|a)) (?<value>(?<adjective>[^ ]+) (?<animal>(fox|dog)))/,
    });
    const wordDef = definition({ type: "word", regex: /[^ ]+/ });
    const tokenize = lexer([groupDef, wordDef, spaceDef]);
    expect(tokenize("the quick fox jumps over the lazy dog")).toEqual([
      { type: "group", value: "quick fox", data: { article: "the", adjective: "quick", animal: "fox" } },
      { type: "space", value: " " },
      { type: "word", value: "jumps" },
      { type: "space", value: " " },
      { type: "word", value: "over" },
      { type: "space", value: " " },
      { type: "group", value: "lazy dog", data: { article: "the", adjective: "lazy", animal: "dog" } },
    ]);
  });

  it.concurrent("can tokenize a string with nested definitions", async ({ expect }) => {
    const helloDef = definition({ type: "hello", regex: /hello/ });
    const worldDef = definition({ type: "world", regex: /world/ });
    const helloWorldDef = definition({ type: "helloWorld", regex: `${helloDef} ${worldDef}`, deep: true });
    const tokenize = lexer([helloWorldDef, helloDef, worldDef, spaceDef]);
    expect(tokenize("hello world hello")).toEqual([
      {
        type: "helloWorld",
        value: "hello world",
        children: [
          { type: "hello", value: "hello" },
          { type: "space", value: " " },
          { type: "world", value: "world" },
        ],
      },
      { type: "space", value: " " },
      { type: "hello", value: "hello" },
    ]);
  });

  it.concurrent("can tokenize a string with nested definitions and a custom value portion", async ({ expect }) => {
    const groupDef = definition({
      type: "group",
      regex: /the (?<value>(?<adjective>[^ ]+) (?<animal>(fox|dog)+))/,
      deep: true,
    });
    const wordDef = definition({ type: "word", regex: /[^ ]+/ });
    const tokenize = lexer([groupDef, wordDef, spaceDef]);
    expect(tokenize("the quick fox jumps over the lazy dog")).toEqual([
      {
        type: "group",
        value: "quick fox",
        data: {
          adjective: "quick",
          animal: "fox",
        },
        children: [
          { type: "word", value: "quick" },
          { type: "space", value: " " },
          { type: "word", value: "fox" },
        ],
      },
      { type: "space", value: " " },
      { type: "word", value: "jumps" },
      { type: "space", value: " " },
      { type: "word", value: "over" },
      { type: "space", value: " " },
      {
        type: "group",
        value: "lazy dog",
        data: {
          adjective: "lazy",
          animal: "dog",
        },
        children: [
          { type: "word", value: "lazy" },
          { type: "space", value: " " },
          { type: "word", value: "dog" },
        ],
      },
    ]);
  });

  it.concurrent("can tokenize a string with deep nested definitions", async ({ expect }) => {
    const def1 = definition({ type: "token1", regex: /mock/, deep: true });
    const def2 = definition({ type: "token2", regex: /mock/ });
    const tokenize = lexer([def1, def2]);
    expect(tokenize("mock")).toEqual([
      {
        type: "token1",
        value: "mock",
        children: [
          {
            type: "token2",
            value: "mock",
          },
        ],
      },
    ]);
  });

  it.concurrent("can handle nested definitions without infinite loop", async ({ expect }) => {
    const def1 = definition({ type: "token1", regex: /mock/, deep: true });
    const def2 = definition({ type: "token2", regex: /mock/, deep: true });
    const def3 = definition({ type: "token3", regex: /mock/ });
    const tokenize1 = lexer([def1, def2, def3]);
    const tokenize2 = lexer([def1, def2]);
    const tokenize3 = lexer([def1, def3]);
    expect(() => tokenize1("mock")).toThrow('Infinite loop detected for "mock": token1 -> token2');
    expect(() => tokenize2("mock")).toThrow('Infinite loop detected for "mock": token1 -> token2');
    expect(() => tokenize3("mock")).not.toThrow('Infinite loop detected for "mock": token1 -> token2');
  });

  it.concurrent("can handle nested recursive definitions without infinite loop", async ({ expect }) => {
    const sprepDef = definition({ type: "sprep", regex: /of (A|B|C)( of (A|B|C))*/, deep: true });
    const snDef = definition({ type: "sn", regex: /(A|B|C)( of (A|B|C))*/, deep: true });
    const prepDef = definition({ type: "prep", regex: /of/ });
    const nounDef = definition({ type: "noun", regex: /(A|B|C)/ });
    const nounDeepDef = definition({ type: "noun", regex: /(A|B|C)/, deep: true });
    const spaceDef = definition({ type: "space", regex: /[ ]+/, wordBoundary: false, skip: true });

    const tokenize1 = lexer([sprepDef, snDef, prepDef, nounDeepDef, spaceDef]);
    const tokenize2 = lexer([sprepDef, snDef, prepDef, nounDef, spaceDef]);

    expect(() => tokenize1("of A of B of C")).toThrow('Infinite loop detected for "A": sprep -> sn -> noun');

    expect(tokenize2("of A of B of C")).toEqual([
      {
        type: "sprep",
        value: "of A of B of C",
        children: [
          { type: "prep", value: "of" },
          {
            type: "sn",
            value: "A of B of C",
            children: [
              { type: "noun", value: "A" },
              {
                type: "sprep",
                value: "of B of C",
                children: [
                  { type: "prep", value: "of" },
                  {
                    type: "sn",
                    value: "B of C",
                    children: [
                      { type: "noun", value: "B" },
                      {
                        type: "sprep",
                        value: "of C",
                        children: [
                          { type: "prep", value: "of" },
                          {
                            type: "sn",
                            value: "C",
                            children: [{ type: "noun", value: "C" }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });
});

describe("Process functions", () => {
  const spaceDef = definition({ type: "space", regex: /[ ]+/, wordBoundary: false });
  const mockProcessFunction = (token: Token) => ({ ...token, value: token.value.toUpperCase() });

  it.concurrent(
    "can tokenize a string with multiple definitions and multiple matches with a local processor",
    async ({ expect }) => {
      const helloDef = definition({ type: "hello", regex: /hello/, process: mockProcessFunction });
      const worldDef = definition({ type: "world", regex: /world/ });
      const tokenize = lexer([helloDef, worldDef, spaceDef]);

      expect(tokenize("hello world")).toEqual([
        { type: "hello", value: "HELLO" },
        { type: "space", value: " " },
        { type: "world", value: "world" },
      ]);
    },
  );

  it.concurrent(
    "can tokenize a string with multiple definitions and multiple matches with a tokenizer processor",
    async ({ expect }) => {
      const helloDef = definition({ type: "hello", regex: /hello/ });
      const worldDef = definition({ type: "world", regex: /world/ });
      const tokenize = lexer([helloDef, worldDef, spaceDef]);

      expect(tokenize("hello world", mockProcessFunction)).toEqual([
        { type: "hello", value: "HELLO" },
        { type: "space", value: " " },
        { type: "world", value: "WORLD" },
      ]);
    },
  );

  it.concurrent(
    "can tokenize a string with multiple definitions and multiple matches with a lexer processor",
    async ({ expect }) => {
      const helloDef = definition({ type: "hello", regex: /hello/ });
      const worldDef = definition({ type: "world", regex: /world/ });
      const tokenize = lexer([helloDef, worldDef, spaceDef], mockProcessFunction);

      expect(tokenize("hello world")).toEqual([
        { type: "hello", value: "HELLO" },
        { type: "space", value: " " },
        { type: "world", value: "WORLD" },
      ]);
    },
  );

  it.concurrent("all process functions are called", async ({ expect }) => {
    const lexerProcessor = vi.fn((arg) => arg);
    const tokenizer1Processor = vi.fn((arg) => arg);
    const tokenizer2Processor = vi.fn((arg) => arg);
    const local11Processor = vi.fn((arg) => arg);
    const local12Processor = vi.fn((arg) => arg);
    const local21Processor = vi.fn((arg) => arg);
    const local22Processor = vi.fn((arg) => arg);

    const def11 = definition({ type: "mock", regex: /[^ ]+/, process: local11Processor });
    const def12 = definition({ type: "mock", regex: /[ ]+/, process: local12Processor, wordBoundary: false });
    const def21 = definition({ type: "mock", regex: /[^ ]+/, process: local21Processor });
    const def22 = definition({ type: "mock", regex: /[ ]+/, process: local22Processor, wordBoundary: false });

    const tokenize1 = lexer([def11, def12], lexerProcessor);
    tokenize1("hello world", tokenizer1Processor);

    const tokenize2 = lexer([def21, def22], lexerProcessor);
    tokenize2("hello world", tokenizer2Processor);

    expect(lexerProcessor).toBeCalledTimes(6);
    expect(tokenizer1Processor).toBeCalledTimes(3);
    expect(tokenizer2Processor).toBeCalledTimes(3);
    expect(local11Processor).toBeCalledTimes(2);
    expect(local12Processor).toBeCalledTimes(1);
    expect(local21Processor).toBeCalledTimes(2);
    expect(local22Processor).toBeCalledTimes(1);
  });

  it.concurrent("can tokenize a string with all processors in correct order", async ({ expect }) => {
    const localProcessor = (token: Token) => ({ ...token, value: `${token.value}-local` });
    const tokenizerProcessor = (token: Token) => ({ ...token, value: `${token.value}-tokenizer` });
    const lexerProcessor = (token: Token) => ({ ...token, value: `${token.value}-lexer` });

    const hello = definition({ type: "hello", regex: /hello/, process: localProcessor });
    const tokenize = lexer([hello], lexerProcessor);

    expect(tokenize("hello", tokenizerProcessor)).toEqual([{ type: "hello", value: "hello-local-tokenizer-lexer" }]);
  });

  it.concurrent("can add extra data", async ({ expect }) => {
    const localProcessor = (token: Token) => ({ ...token, data: { ...token.data, local: "local" } });
    const tokenizerProcessor = (token: Token) => ({ ...token, data: { ...token.data, tokenizer: "tokenizer" } });
    const lexerProcessor = (token: Token) => ({ ...token, data: { ...token.data, lexer: "lexer" } });

    const hello = definition({ type: "hello", regex: /hello/, process: localProcessor });
    const tokenize = lexer([hello], lexerProcessor);

    expect(tokenize("hello", tokenizerProcessor)).toEqual([
      { type: "hello", value: "hello", data: { local: "local", tokenizer: "tokenizer", lexer: "lexer" } },
    ]);
  });
});
