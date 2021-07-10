import chalk from 'chalk';
import * as Konsol from './konsol';

const escapeString = (node: string, quote: string): string => {
  return `${quote}${node.replace(new RegExp(quote, 'gm'), `\\${quote}`)}${quote}`;
};
const unescapeString = (node: string) => {
  if (/^'(?:[^\\']|\\')*'$/.test(node)) {
    return node.slice(1, -1).replace(/\\'/gm, '\'');
  }
  if (/^"(?:[^\\"]|\\")*"$/.test(node)) {
    return node.slice(1, -1).replace(/\\"/gm, '"');
  }
  if (/^`(?:[^\\`]|\\`)*`$/.test(node)) {
    return node.slice(1, -1).replace(/\\`/gm, '`');
  }
  return node;
};

const styleFunction = (name: string, args: string) => `${chalk.cyan(name || chalk.italic('function'))}(${args}) ${chalk.gray('=> ...')}`;

const ofFunction = (input: (...args: any[]) => any) => {
  const content = input.toString().trim().replace(/((?:function)?)\s+([a-zA-Z$_][a-zA-Z0-9$_]*)\s*/gm, '$1 $2');
  const bracket = content.indexOf('(');
  const regexified = content
    .replace(/\1/gm, '')
    .replace(/"(?:[^\\"]|\\")*"|'(?:[^\\']|\\')*'|`(?:[^\\`]|\\`)*`/gm, (m) => m.replace(/\//gm, '\u0001'))
    .replace(/(\/\*[^*]+\*\/)|(\/\/[^\n]*)/gm, '')
    .replace(/\1/gm, '/')
    .replace(/"(?:[^\\"]|\\")*"|'(?:[^\\']|\\')*'|`(?:[^\\`]|\\`)*`/gm, (m) => m.replace(/\)/gm, '\u0001'))
    .replace(/\).*/gm, '')
    .replace(/\1/gm, '=>');
  return styleFunction((content.startsWith('function') ? content.slice(9, bracket) : '') || input.name, format(parseJSONLike(regexified.slice(bracket + 1, -1)), undefined, { hideUndefined: true, stringStyle: 'key', keyFormat: chalk.magentaBright.italic }).slice(1, -1));
}

const ofKey = (key: string, bonus?: (key: string) => string): string => /^[a-zA-Z$_][a-zA-Z$_0-9]*$/gm.test(key) ? bonus !== undefined ? bonus(key) : key : ofString(key);


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

interface FormattingOptions {
  stringStyle: 'key' | 'string';
  hideUndefined: boolean;
  propogateOptions: boolean;
  keyFormat: (key: string) => string;
}

const format = (node: any, depth?: number, options?: Partial<FormattingOptions>): string => {
  const {
    stringStyle,
    propogateOptions,
    hideUndefined,
    keyFormat,
  }: FormattingOptions = {
    keyFormat: (key) => key,
    stringStyle: 'string',
    propogateOptions: true,
    hideUndefined: false,
    ...options,
  };
  if (node === undefined) {
    return hideUndefined ? '' : chalk.gray('undefined');
  }

  if (node === null) {
    return chalk.bold('null');
  }

  if (Array.isArray(node)) {
    return (depth ?? -1) === 0 ? chalk.cyan('[Array]') : `[${node.map(element => hideUndefined && element === undefined ? ',' : format(element, depth === undefined ? -1 : depth - 1, propogateOptions ? options : undefined)).join(', ')}]`;
  }

  switch (typeof node) {
    case 'bigint':
      return chalk.yellow(`${node}n`);
    case 'boolean':
      return chalk.yellow(node);
    case 'function':
      return ofFunction(node);
    case 'number':
      return chalk.yellow(node);
    case 'object':
      return (depth ?? -1) === 0 ? chalk.cyan('[Object]') : `{ ${Object.entries(node).map(([key, value]) => hideUndefined && value === undefined ? ofKey(key, keyFormat) : `${ofKey(key, keyFormat)}: ${format(value, depth === undefined ? -1 : depth - 1, propogateOptions ? options : undefined)}`).join(', ')} }`;
    case 'string':
      return stringStyle === 'key' ? ofKey(node, keyFormat) : ofString(node);
    case 'symbol':
      return chalk.green(node.toString());
    default:
      return node;
  }
};

const pseudoformat = (part: string, depth?: number, options?: Partial<FormattingOptions>) => typeof part === 'string' ? part : format(part, depth, { ...(options ?? {}), stringStyle: 'key', propogateOptions: false });

const substitute = (message?: any, ...optionalParams: any[]): string => typeof message === 'string' && optionalParams.length > 0 && message.includes('%s') ? substitute(message.replace('%s', pseudoformat(optionalParams[0])), ...optionalParams.slice(1)) : [...(message !== undefined ? [message] : []), ...optionalParams].map(part => pseudoformat(part)).join('');

const timers = new Map<string, number>();

type ConditionalProperty<T extends keyof any, U extends Record<keyof any, any>, V> = U[T] extends V ? T : V;

//const logEvent = <T extends ConditionalProperty<keyof Konsol.Events, Konsol.Events, (formatted: string) => void>>(key: T, format?: (...parts: any[]) => string, log?: (message: string) => void) => (...parts: any[]) => {
//  const formatted = (format ?? substitute)(...parts);
//  (log ?? console.log)(formatted);
//  konsol.hooks.emit(key, formatted);
//};

//const b: ConditionalProperty<keyof Konsol.Events, Konsol.Events, (formatted: string) => void> = null as any;

const konsol: { hooks: Konsol.Emitter } & Console = Object.assign(substitute, { hooks: new Konsol.Emitter() }, {
  assert: (value: any, message?: string, ...optionalParams: any[]) => value === false ? konsol.log('Assertion failed: ', message, ...optionalParams) : void 0,
  memory: console.memory,
  clear: console.clear,
  count: console.count,
  countReset: console.countReset,
  debug: (...parts: any[]) => konsol.log(...parts),
  dir: (...parts: any[]) => konsol.log(...parts.map((part) => format(part))),
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
  log: (...parts: any[]) => console.log(substitute(...parts)),
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

const parseJSONLike = (jsonLike: string) => {
  const stacket = ['['];
  const result: any[] = [];
  const pointers: any[] = [result];

  let heap: any[] = [''];

  //konsol.log(' >> heap: ', heap);
  //konsol.log(' >> ptrs: ', pointers);
  //konsol.log(' >> rslt: ', result);
  const chars = [...jsonLike.split(''), ','];
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const rest = chars.slice(i + 1).join('');
    //konsol.log(' >> ', format(char));
    //konsol.log('   >> rest: ', format(rest));
    if (char === '[' || char === '{' || char === ']' || char === '}' || char === ',' || char === ':') {
      const pointer = pointers.slice(-1)[0];
      const bracket = stacket.slice(-1)[0];

      let shhoddy = [];
      if (char === '[' || char === '{') {
        const next: [] | {} = char === '[' ? [] : {};
        shhoddy.push(next);
        if (bracket === '[') {
          pointer.push(next);
          pointers.push(pointer.slice(-1)[0]);
        } else {
          pointers.push(pointer[heap[0]] = next);
        }
        stacket.push(char);
      } else if (char === ']' || char === '}') {
        stacket.pop();
        pointers.pop();
      }

      if (heap[0].length > 0) {
        if (char === ':') {
          const match = rest.match(/^[a-zA-Z$_][a-zA-Z0-9$_]*/m);
          if (match !== null) {
            heap.push(match[0]);
            i += match[0].length;
          }
        }

        bracket === '[' ? pointer.push(heap[0]) : pointer[heap[0]] = [...shhoddy, heap[1], undefined][0];
      }
      heap = [''];
    } else {
      const match = (char + rest).match(/^(?:"(?:[^\\"]|\\")*"|'(?:[^\\']|\\')*'|`(?:[^\\`]|\\`)*`)/m);

      if (match !== null) {
        const old = heap.pop();
        heap.push(old + match[0]);
        i += match[0].length - 1;
      } else if (!/\s/.test(char)) {
        const old = heap.pop();
        heap.push(old + char);
      }
    }
    //konsol.log('   >> heap: ', heap);
    //konsol.log('   >> ptrs: ', pointers);
    //konsol.log('   >> rslt: ', result);
  }
  return result;
};
const b = (a: any, b: any, c: any, { 'k': l }: { 'k': any }) => null;
const b2 = function b(a: any, b: any, c: any, { 'k': l }: { 'k': any }) { return null; };
konsol.log(b);
konsol.log(b2);