import chalk from 'chalk';

const escapeString = (node: string, quote: string): string => {
  return `${quote}${node.replace(new RegExp(quote, 'gm'), `\\${quote}`)}${quote}`;
};

// const parseJSONLike = (jsonLike: string) => {

// };

// const getParameters = (input: Function) => (`{${input.toString()
//   .replace(/\1/gm, '')
//   .replace(/("([^\\"]|\\")*")|('([^\\']|\\')*')|(`([^\\`]|\\`)*`)/gm, (m) => m.replace(/\//gm, '\u0001'))
//   .replace(/(\/\*[^*]+\*\/)|(\/\/[^\n]*)/gm, '')
//   .replace(/\1/gm, '/')
//   .replace(/("([^\\"]|\\")*")|('([^\\']|\\')*')|(`([^\\`]|\\`)*`)/gm, (m) => m.replace(/=>/gm, '\u0001'))
//   .replace(/=>.*/gm, '')
//   .replace(/\1/gm, '=>')
//   .replace(/([a-zA-Z$_][a-zA-Z0-9$_]*|(?:"(?:[^\\"]|\\")*"|'(?:[^\\']|\\')*'|`(?:[^\\`]|\\`)*`))/gm, (m) => escapeString(/^['"`]/g.test(m) ? m.slice(1, -1) : m, '"'))
//   .slice(1, -1)}}`);


const ofKey = (key: string): string => /^[a-zA-Z$_][a-zA-Z$_0-9]*$/gm.test(key) ? `${key}` : ofString(key);


const ofString = (node: string): string => {
  const single = node.includes('\'');
  const double = node.includes('"');
  const back = node.includes('`');
  if (single) {
    if (double) {
      if (back) {
        return chalk.green(escapeString(node, '\''));
      } else {
        return chalk.green(`\`${node}\``);
      }
    } else {
      return chalk.green(`"${node}"`);
    }
  } else {
    return chalk.green(`'${node}'`);
  }
};

const format = (node: any, depth?: number): string => {
  if (node === undefined) {
    return chalk.gray('undefined');
  }

  if (node === null) {
    return chalk.bold('null');
  }

  if (Array.isArray(node)) {
    return (depth ?? -1) === 0 ? chalk.cyan('[Array]') : `[${node.map(element => format(element, depth === undefined ? -1 : depth - 1)).join(', ')}]`;
  }

  switch (typeof node) {
    case 'bigint':
      return chalk.yellow(`${node}n`);
    case 'boolean':
      return chalk.yellow(node);
    case 'function':
      return chalk.cyan(node);
    case 'number':
      return chalk.yellow(node);
    case 'object':
      return (depth ?? -1) === 0 ? chalk.cyan('[Object]') : `{ ${Object.entries(node).map(([key, value]) => `${ofKey(key)}: ${format(value, depth === undefined ? -1 : depth - 1)}`).join(', ')} }`;
    case 'string':
      return ofString(node);
    case 'symbol':
      return chalk.green(node.toString());
    default:
      return node;
  }
};