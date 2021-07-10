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

const pseudoformat = (part: string) => typeof part === 'string' ? part : format(part);

const substitute = (message?: any, ...optionalParams: any[]): string => typeof message === 'string' && optionalParams.length > 0 && message.includes('%s') ? substitute(message.replace('%s', pseudoformat(optionalParams[0])), ...optionalParams.slice(1)) : [...(message !== undefined ? [message] : []), ...optionalParams].map(pseudoformat).join('');


interface Konsol {
  (message?: any, ...optionalParams: any[]): string;
}

const timers = new Map<string, number>();

const konsol: Konsol & Console = Object.assign(substitute, {
  assert: (value: any, message?: string, ...optionalParams: any[]) => value === false ? konsol.log('Assertion failed: ', message, ...optionalParams) : void 0,
  memory: console.memory,
  clear: console.clear,
  count: console.count,
  countReset: console.countReset,
  debug: (...parts: any[]) => konsol.log(...parts),
  dir: (...parts: any[]) => konsol.log(...parts.map(format)),
  dirxml: (...parts: any[]) => konsol.log(...parts),
  error: (...parts: any[]) => console.error(...parts),
  exception: (...parts: any[]) => console.error(...parts),
  group: (...parts: any[]) => {
    console.group();
    konsol.log(...parts);
  },
  groupCollapsed: (...parts: any[]) => {
    console.groupCollapsed();
    konsol.log(...parts);
  },
  groupEnd: (...parts: any[]) => {
    console.groupEnd();
    konsol.log(...parts);
  },
  info: (...parts: any[]) => konsol.log(...parts),
  log: (...parts: any[]) => console.log(konsol(...parts)),
  profile: (...parts: any[]) => void 0,
  profileEnd: (...parts: any[]) => void 0,
  table: (...parts: any[]) => void 0,
  time: (label: string) => timers.set(label, new Date().getTime()),
  timeEnd: (label: string) => {
    konsol.timeLog();
    timers.delete(label);
  },
  timeLog: (label: string) => {
    const time = timers.get(label);
    if (time !== undefined) {
      konsol.log(label, ': ', (new Date().getTime() - time) / 1000);
    }
  },
  timeStamp: console.timeStamp,
  trace: console.trace,
  warn: (message?: any, ...extra: any[]) => konsol.log(message, ...extra),
  Console: console.Console,
});

export default konsol;