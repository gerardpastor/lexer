import { describe, it, vi } from "vitest";
import { lexer, definition, Token } from "./index";

describe("Definitions", () => {
  it.concurrent("can provide a single value", async ({ expect }) => {
    expect(definition({ type: "mock", value: "value" }).toString()).toEqual("((value)\\b)");
  });
  it.concurrent("can provide an array of values", async ({ expect }) => {
    expect(definition({ type: "mock", values: ["AA", "BB", "CC"] }).toString()).toEqual("((AA|BB|CC)\\b)");
  });

  it.concurrent("value is escaped", async ({ expect }) => {
    expect(definition({ type: "mock", value: "-[]/{}()*+?.\\^$|" }).toString()).toEqual(
      "((\\-\\[\\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|)\\b)",
    );
  });

  it.concurrent("values are escaped", async ({ expect }) => {
    expect(definition({ type: "mock", value: "-[]/{}()*+?.\\^$|" }).toString()).toEqual(
      "((\\-\\[\\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|)\\b)",
    );
  });

  it.concurrent("can provide an array of values", async ({ expect }) => {
    expect(definition({ type: "mock", values: ["AA", "BB", "CC"] }).toString()).toEqual("((AA|BB|CC)\\b)");
  });

  it.concurrent("regexes are encapsulated", async ({ expect }) => {
    expect(definition({ type: "mock", regex: ".*" }).toString()).toEqual("(.*)");
    expect(definition({ type: "mock", regex: /.*/ }).toString()).toEqual("(.*)");
  });

  it.concurrent("regexes are encapsulated", async ({ expect }) => {
    expect(definition({ type: "mock", regex: ".*" }).toString()).toEqual("(.*)");
    expect(definition({ type: "mock", regex: /.*/ }).toString()).toEqual("(.*)");
  });

  it.concurrent("execution regexes are generated correctly", async ({ expect }) => {
    expect(definition({ type: "mock", regex: ".*" }).execRegex).toEqual(/^(.*)/);
    expect(definition({ type: "mock", regex: /.*/ }).execRegex).toEqual(/^(.*)/);
  });

  it.concurrent("can use regex as a validation function by default", async ({ expect }) => {
    expect(definition({ type: "mock", regex: ".*" }).testRegex).toEqual(/^(.*)/);
    expect(definition({ type: "mock", regex: /.*/ }).testRegex).toEqual(/^(.*)/);
  });

  it.concurrent("can provide a validation regex", async ({ expect }) => {
    expect(definition({ type: "mock", regex: ".*", valid: "[^ ]+" }).testRegex).toEqual(/^([^ ]+)/);
    expect(definition({ type: "mock", regex: /.*/, valid: "[^ ]+" }).testRegex).toEqual(/^([^ ]+)/);
    expect(definition({ type: "mock", regex: ".*", valid: /[^ ]+/ }).testRegex).toEqual(/^([^ ]+)/);
    expect(definition({ type: "mock", regex: /.*/, valid: /[^ ]+/ }).testRegex).toEqual(/^([^ ]+)/);
  });

  it.concurrent("can provide custom regex flags", async ({ expect }) => {
    expect(definition({ type: "mock", regex: ".*", regexFlags: "i" }).execRegex.flags).toEqual("i");
    expect(definition({ type: "mock", regex: /.*/, regexFlags: "i" }).execRegex.flags).toEqual("i");
    expect(definition({ type: "mock", regex: ".*", validFlags: "i" }).testRegex.flags).toEqual("i");
    expect(definition({ type: "mock", regex: /.*/, validFlags: "i" }).testRegex.flags).toEqual("i");
  });

  it.concurrent('cannot provide "g" regex flag', async ({ expect }) => {
    expect(definition({ type: "mock", regex: ".*", regexFlags: "g" }).execRegex.flags).toEqual("");
    expect(definition({ type: "mock", regex: ".*", regexFlags: "gi" }).execRegex.flags).toEqual("i");
    expect(definition({ type: "mock", regex: /.*/, regexFlags: "g" }).execRegex.flags).toEqual("");
    expect(definition({ type: "mock", regex: /.*/, regexFlags: "gi" }).execRegex.flags).toEqual("i");
    expect(definition({ type: "mock", regex: ".*", validFlags: "g" }).testRegex.flags).toEqual("");
    expect(definition({ type: "mock", regex: ".*", validFlags: "gi" }).testRegex.flags).toEqual("i");
    expect(definition({ type: "mock", regex: /.*/, validFlags: "g" }).testRegex.flags).toEqual("");
    expect(definition({ type: "mock", regex: /.*/, validFlags: "gi" }).testRegex.flags).toEqual("i");
  });

  it.concurrent("can access original regex and validation as string", async ({ expect }) => {
    expect(definition({ type: "mock", regex: ".*" }).stringRegex).toEqual("(.*)");
    expect(definition({ type: "mock", regex: /.*/ }).stringRegex).toEqual("(.*)");
    expect(definition({ type: "mock", regex: ".*", valid: ".*" }).stringValid).toEqual("(.*)");
    expect(definition({ type: "mock", regex: /.*/, valid: /.*/ }).stringValid).toEqual("(.*)");
  });

  it.concurrent("can convert to string", async ({ expect }) => {
    expect(definition({ type: "mock", regex: /.*/ }).toString()).toEqual("(.*)");
  });

  it.concurrent("can nest definitions", async ({ expect }) => {
    const word = definition({ type: "word", regex: /[^ ]+/ });
    const space = definition({ type: "space", regex: / +/ });

    const def = definition({ type: "mock", regex: `${word}(${space}${word})?${space}${word}` });

    expect(def.execRegex).toEqual(/^(([^ ]+)(( +)([^ ]+))?( +)([^ ]+))/);
    expect(def.stringRegex).toEqual("(([^ ]+)(( +)([^ ]+))?( +)([^ ]+))");
  });

  it.concurrent("must throw an error if no valid props are provided", async ({ expect }) => {
    expect(() => definition({ type: "mock", value: "" })).toThrow();
    expect(() => definition({ type: "mock", values: [] })).toThrow();
    expect(() => definition({ type: "mock", values: ["", ""] })).toThrow();
    expect(() => definition({ type: "mock", regex: "" })).toThrow();

    expect(() => definition({ type: "mock" } as any)).toThrow();
    expect(() => definition({ type: "mock", regex: /.*/, value: "value" } as any)).toThrow();
    expect(() => definition({ type: "mock", regex: /.*/, values: ["value"] } as any)).toThrow();
    expect(() => definition({ type: "mock", value: "value", values: ["value"] } as any)).toThrow();

    expect(() => definition({ type: "mock", regex: /^.*/ })).toThrow();
    expect(() => definition({ type: "mock", regex: /(^.*)/ })).toThrow();
    expect(() => definition({ type: "mock", regex: /((^.*))/ })).toThrow();
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
  it.concurrent("can tokenize a string", async ({ expect }) => {
    const def = definition({ type: "mock", regex: ".*" });
    const tokenize = lexer([def]);

    expect(tokenize("hello")).toEqual([{ type: "mock", value: "hello", data: {} }]);
  });

  it.concurrent("can tokenize a string with multiple definitions", async ({ expect }) => {
    const word = definition({ type: "word", regex: /[^ ]+/ });
    const space = definition({ type: "space", regex: /[ ]+/ });
    const tokenize = lexer([word, space]);

    expect(tokenize("hello")).toEqual([{ type: "word", value: "hello", data: {} }]);
  });

  it.concurrent("can tokenize a string with multiple definitions and multiple matches", async ({ expect }) => {
    const word = definition({ type: "word", regex: /[^ ]+/ });
    const space = definition({ type: "space", regex: /[ ]+/ });
    const tokenize = lexer([word, space]);

    expect(tokenize("hello world")).toEqual([
      { type: "word", value: "hello", data: {} },
      { type: "space", value: " ", data: {} },
      { type: "word", value: "world", data: {} },
    ]);
  });

  it.concurrent('can tokenize a string using "value" prop', async ({ expect }) => {
    const hello = definition({ type: "mock", value: "hello" });
    const word = definition({ type: "word", regex: /[^ ]+/ });
    const space = definition({ type: "space", regex: /[ ]+/ });
    const tokenize = lexer([hello, word, space]);

    expect(tokenize("hello world")).toEqual([
      { type: "mock", value: "hello", data: {} },
      { type: "space", value: " ", data: {} },
      { type: "word", value: "world", data: {} },
    ]);
  });

  it.concurrent('can tokenize a string using "values" prop', async ({ expect }) => {
    const mock = definition({ type: "mock", values: ["hello", "world"] });
    const space = definition({ type: "space", regex: /[ ]+/ });
    const tokenize = lexer([mock, space]);

    expect(tokenize("hello world")).toEqual([
      { type: "mock", value: "hello", data: {} },
      { type: "space", value: " ", data: {} },
      { type: "mock", value: "world", data: {} },
    ]);
  });

  it.concurrent("con tokenize definitions with same type but different regex", async ({ expect }) => {
    const word = definition({ type: "token", regex: /[^ ]+/ });
    const space = definition({ type: "token", regex: /[ ]+/ });
    const tokenize = lexer([word, space]);

    expect(tokenize("hello world")).toEqual([
      { type: "token", value: "hello", data: {} },
      { type: "token", value: " ", data: {} },
      { type: "token", value: "world", data: {} },
    ]);
  });

  it.concurrent("definitions with equal regex must match the first one", async ({ expect }) => {
    const mock1 = definition({ type: "mock1", regex: /[^ ]+/ });
    const mock2 = definition({ type: "mock2", regex: /[^ ]+/ });
    const tokenize = lexer([mock1, mock2]);

    expect(tokenize("mock")).toEqual([{ type: "mock1", value: "mock", data: {} }]);
  });

  it.concurrent('can skip definitions with "skip" property', async ({ expect }) => {
    const word = definition({ type: "word", regex: /[^ ]+/ });
    const space = definition({ type: "space", regex: /[ ]+/, skip: true });
    const tokenize = lexer([word, space]);

    expect(tokenize("hello world")).toEqual([
      { type: "word", value: "hello", data: {} },
      { type: "word", value: "world", data: {} },
    ]);
  });

  it.concurrent("can tokenize a string with extra data", async ({ expect }) => {
    const helloWorld = definition({ type: "group", regex: /the (?<adjective>[^ ]+) (?<animal>(fox|dog)+)/ });
    const word = definition({ type: "word", regex: /[^ ]+/ });
    const space = definition({ type: "space", regex: /[ ]+/ });
    const tokenize = lexer([helloWorld, word, space]);

    expect(tokenize("the quick fox jumps over the lazy dog")).toEqual([
      { type: "group", value: "the quick fox", data: { adjective: "quick", animal: "fox" } },
      { type: "space", value: " ", data: {} },
      { type: "word", value: "jumps", data: {} },
      { type: "space", value: " ", data: {} },
      { type: "word", value: "over", data: {} },
      { type: "space", value: " ", data: {} },
      { type: "group", value: "the lazy dog", data: { adjective: "lazy", animal: "dog" } },
    ]);
  });

  it.concurrent("can tokenize a string with custom value portion", async ({ expect }) => {
    const helloWorld = definition({ type: "group", regex: /the (?<value>(?<adjective>[^ ]+) (?<animal>(fox|dog)+))/ });
    const word = definition({ type: "word", regex: /[^ ]+/ });
    const space = definition({ type: "space", regex: /[ ]+/ });
    const tokenize = lexer([helloWorld, word, space]);

    expect(tokenize("the quick fox jumps over the lazy dog")).toEqual([
      { type: "group", value: "quick fox", data: { adjective: "quick", animal: "fox" } },
      { type: "space", value: " ", data: {} },
      { type: "word", value: "jumps", data: {} },
      { type: "space", value: " ", data: {} },
      { type: "word", value: "over", data: {} },
      { type: "space", value: " ", data: {} },
      { type: "group", value: "lazy dog", data: { adjective: "lazy", animal: "dog" } },
    ]);
  });

  it.concurrent("can tokenize a string with nested definitions", async ({ expect }) => {
    const space = definition({ type: "space", regex: /[ ]+/ });
    const hello = definition({ type: "hello", regex: /hello/ });
    const world = definition({ type: "world", regex: /world/ });
    const helloWorld = definition({ type: "helloWorld", regex: `${hello} ${world}`, deep: true });

    const tokenize = lexer([helloWorld, hello, world, space]);

    expect(tokenize("hello world hello")).toEqual([
      {
        type: "helloWorld",
        value: "hello world",
        data: {},
        children: [
          { type: "hello", value: "hello", data: {} },
          { type: "space", value: " ", data: {} },
          { type: "world", value: "world", data: {} },
        ],
      },
      { type: "space", value: " ", data: {} },
      { type: "hello", value: "hello", data: {} },
    ]);
  });

  it.concurrent("can tokenize a string with  nested definitions and a custom value portion", async ({ expect }) => {
    const helloWorld = definition({
      type: "group",
      regex: /the (?<value>(?<adjective>[^ ]+) (?<animal>(fox|dog)+))/,
      deep: true,
    });
    const word = definition({ type: "word", regex: /[^ ]+/ });
    const space = definition({ type: "space", regex: /[ ]+/, skip: true });
    const tokenize = lexer([helloWorld, word, space]);

    expect(tokenize("the quick fox jumps over the lazy dog")).toEqual([
      {
        type: "group",
        value: "quick fox",
        data: {
          adjective: "quick",
          animal: "fox",
        },
        children: [
          { type: "word", value: "quick", data: {} },
          { type: "word", value: "fox", data: {} },
        ],
      },
      { type: "word", value: "jumps", data: {} },
      { type: "word", value: "over", data: {} },
      {
        type: "group",
        value: "lazy dog",
        data: {
          adjective: "lazy",
          animal: "dog",
        },
        children: [
          { type: "word", value: "lazy", data: {} },
          { type: "word", value: "dog", data: {} },
        ],
      },
    ]);
  });

  it.concurrent("can tokenize a string with deep nested definitions", async ({ expect }) => {
    const mock1 = definition({ type: "mock1", regex: /mock/, deep: true });
    const mock2 = definition({ type: "mock2", regex: /mock/, deep: true });
    const mock3 = definition({ type: "mock3", regex: /mock/ });

    const tokenize = lexer([mock1, mock2, mock3]);

    expect(tokenize("mock")).toEqual([
      {
        type: "mock1",
        value: "mock",
        data: {},
        children: [
          {
            type: "mock2",
            value: "mock",
            data: {},
            children: [
              {
                type: "mock3",
                value: "mock",
                data: {},
              },
            ],
          },
        ],
      },
    ]);
  });

  it.concurrent("can handle nested definitions without infinite loop", async ({ expect }) => {
    const mock1 = definition({ type: "mock1", regex: /mock/, deep: true });
    const mock2 = definition({ type: "mock2", regex: /mock/, deep: true });
    const mock3 = definition({ type: "mock3", regex: /mock/ });

    const tokenize1 = lexer([mock1, mock2, mock3]);
    const tokenize2 = lexer([mock1, mock2]);

    expect(() => tokenize1("mock")).not.toThrow();
    expect(() => tokenize2("mock")).toThrow();
  });

  it.concurrent("definitions are tested in order", async ({ expect }) => {
    const space = definition({ type: "space", regex: /[ ]+/ }) as any;
    const hello = definition({ type: "hello", regex: /hello/ }) as any;
    const world = definition({ type: "world", regex: /[^ ]+/ }) as any;

    const calls: string[] = [];

    const spaceTest = space.test.bind(space);
    space.test = (str: any) => {
      calls.push("space");
      return spaceTest(str);
    };

    const helloTest = hello.test.bind(hello);
    hello.test = (str: any) => {
      calls.push("hello");
      return helloTest(str);
    };

    const worldTest = world.test.bind(world);
    world.test = (str: any) => {
      calls.push("world");
      return worldTest(str);
    };

    const tokenize = lexer([space, hello, world]);
    tokenize("hello world");

    expect(calls).toEqual(["space", "hello", "space", "space", "hello", "world"]);
  });

  it.concurrent("must throw an error if no definition matches", async ({ expect }) => {
    const mock = definition({ type: "mock", regex: /[ ]+/ });
    const tokenize = lexer([mock]);

    expect(() => tokenize("mock")).toThrow('No definition matched for "mock"');
  });

  it.concurrent("must throw an error if regex not matches with a passed test", async ({ expect }) => {
    const mock = definition({ type: "mock", regex: /[ ]+/, valid: /[^ ]+/ });
    const tokenize = lexer([mock]);

    expect(() => tokenize("mock")).toThrow('No value matched for "mock"');
  });
});

describe("Process functions", () => {
  const mockProcessFunction = (token: Token) => ({ ...token, value: token.value.toUpperCase() });

  it.concurrent(
    "can tokenize a string with multiple definitions and multiple matches with a local processor",
    async ({ expect }) => {
      const hello = definition({ type: "hello", regex: /hello/, process: mockProcessFunction });
      const world = definition({ type: "world", regex: /world/ });
      const space = definition({ type: "space", regex: /[ ]+/ });
      const tokenize = lexer([hello, world, space]);

      expect(tokenize("hello world")).toEqual([
        { type: "hello", value: "HELLO", data: {} },
        { type: "space", value: " ", data: {} },
        { type: "world", value: "world", data: {} },
      ]);
    },
  );

  it.concurrent(
    "can tokenize a string with multiple definitions and multiple matches with a tokenizer processor",
    async ({ expect }) => {
      const hello = definition({ type: "hello", regex: /hello/ });
      const world = definition({ type: "world", regex: /world/ });
      const space = definition({ type: "space", regex: /[ ]+/ });
      const tokenize = lexer([hello, world, space]);

      expect(tokenize("hello world", mockProcessFunction)).toEqual([
        { type: "hello", value: "HELLO", data: {} },
        { type: "space", value: " ", data: {} },
        { type: "world", value: "WORLD", data: {} },
      ]);
    },
  );

  it.concurrent(
    "can tokenize a string with multiple definitions and multiple matches with a lexer processor",
    async ({ expect }) => {
      const hello = definition({ type: "hello", regex: /hello/ });
      const world = definition({ type: "world", regex: /world/ });
      const space = definition({ type: "space", regex: /[ ]+/ });
      const tokenize = lexer([hello, world, space], mockProcessFunction);

      expect(tokenize("hello world")).toEqual([
        { type: "hello", value: "HELLO", data: {} },
        { type: "space", value: " ", data: {} },
        { type: "world", value: "WORLD", data: {} },
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
    const def12 = definition({ type: "mock", regex: /[ ]+/, process: local12Processor });
    const def21 = definition({ type: "mock", regex: /[^ ]+/, process: local21Processor });
    const def22 = definition({ type: "mock", regex: /[ ]+/, process: local22Processor });

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

    expect(tokenize("hello", tokenizerProcessor)).toEqual([
      { type: "hello", value: "hello-local-tokenizer-lexer", data: {} },
    ]);
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
