export const escapeLiteral = (regex: string) => regex.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\^\$\|]/g, "\\$&");
export const regexAsString = (regex: string | RegExp) => (typeof regex === "string" ? regex : regex.source);
export const buildRegex = (regex: string, flags = "") => new RegExp("^" + regex, flags.replace("g", ""));
export const asArray = <T>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value]);
export const cleanRegexGroups = (regex: string) =>  `${regex}`.toString().replace(/\?<[^>]+>/g, "");

export const checkProp = (value: RegExp | string | (RegExp | string)[] | undefined) => {
  if (value === undefined) return true;
  if (!value) return false;
  const values = asArray(value);
  return !!values.length && values.every((v) => (typeof v === "string" ? !!v.length : v.source !== "(?:)"));
};
