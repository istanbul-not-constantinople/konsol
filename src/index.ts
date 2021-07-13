import chalk from 'chalk';
import * as Konsol from './konsol';

const escapeString = (node: string, quote: string): string => {
  return `${quote}${node.replace(new RegExp(quote, 'gm'), `\\${quote}`)}${quote}`;
};
const unescapeString = (node: string) => {
  if (/^'(?:[^\\']|\\')*'$/m.test(node)) {
    return node.slice(1, -1).replace(/\\'/gm, '\'');
  }
  if (/^"(?:[^\\"]|\\")*"$/m.test(node)) {
    return node.slice(1, -1).replace(/\\"/gm, '"');
  }
  if (/^`(?:[^\\`]|\\`)*`$/m.test(node)) {
    return node.slice(1, -1).replace(/\\`/gm, '`');
  }
  return node;
};

const styleFunction = (name: string, args: string, result: string) => `${chalk.cyan(name || chalk.gray('[anonymous] '))}(${args}) ${chalk.gray('=>')} ${result}`;

const ofFunction = (func: (...args: any[]) => any, options?: Partial<FunctionOptions<any>>) => {
  const rawContent = func.toString().trim();
  const content = (rawContent.startsWith('function') ? rawContent.slice(8).trim() : rawContent.replace(/^([a-zA-Z$_][a-zA-Z0-9$_]*)\s*/m, `($1) `));
  const bracket = content.indexOf('(');
  let regexified = content
    .replace(/\1/gm, '')
    .replace(/"(?:[^\\"]|\\")*"|'(?:[^\\']|\\')*'|`(?:[^\\`]|\\`)*`/gm, (m) => m.replace(/\//gm, '\u0001'))
    .replace(/(\/\*[^*]+\*\/)|(\/\/[^\n]*)/gm, '')
    .replace(/\1/gm, '/')
    .replace(/"(?:[^\\"]|\\")*"|'(?:[^\\']|\\')*'|`(?:[^\\`]|\\`)*`/gm, (m) => m.replace(/\)/gm, '\u0001'));
  regexified = regexified.slice(0, regexified.indexOf(')')).replace(/\1/gm, ')');
  return styleFunction(options?.name ?? func.name, format(parseJSONLike(regexified.slice(bracket + 1)), undefined, { hideUndefined: true, stringStyle: 'key', keyFormat: (key: string) => key.startsWith('...') ? `${chalk.gray('...')}${chalk.magentaBright.italic(key.slice(3))}` : chalk.magentaBright.italic(key), keyPredicate: (key: string) => /^(?:...)?[a-zA-Z$_][a-zA-Z$_0-9]*$/gm.test(key) }).slice(1, -1), options?.cachedResult ? format(options.cachedResult) : chalk.gray('...'));
};

interface FunctionOptions<T> {
  cachedResult: T;
  name: string;
}

interface FunctionCallOptions<T> extends FunctionOptions<T> {
  run: boolean;
}

const ofFunctionCall = <T extends (...args: U) => V, U extends any[], V>(func: T, args: U, options?: Partial<FunctionCallOptions<V>>) => {
  const content = func.toString().trim().replace(/((?:function)?)\s+([a-zA-Z$_][a-zA-Z0-9$_]*)\s*/gm, '$1 $2');
  const bracket = content.indexOf('(');
  return styleFunction(options?.name ?? ((content.startsWith('function') ? content.slice(9, bracket) : '') || func.name), format(args).slice(1, -1), options?.cachedResult !== undefined ? format(options.cachedResult) : (options?.run ?? true) ? format(func(...args)) : chalk.gray('...'));
};

const keyCheck = (key: string) => /^[a-zA-Z$_][a-zA-Z$_0-9]*$/gm.test(key ?? '');
const ofKey = (key: string, bonus?: (key: string) => string, isKey?: (key: string) => boolean): string => key !== undefined ? (isKey ?? keyCheck)(key) ? bonus !== undefined ? bonus(key) : key : ofString(key) : format(key);

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
  depth: number;
  stringStyle: 'key' | 'string';
  hideUndefined: boolean;
  propogateOptions: boolean;
  keyFormat: (key: string) => string;
  keyPredicate: (key: string) => boolean;
}

const format = (node: any, depth?: number, options?: Partial<FormattingOptions>): string => {
  const {
    depth: deepeningCapacity,
    stringStyle,
    propogateOptions,
    hideUndefined,
    keyFormat,
    keyPredicate,
  }: FormattingOptions = {
    keyFormat: (key) => key,
    keyPredicate: keyCheck,
    depth: depth ?? -1,
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
    return (deepeningCapacity ?? -1) === 0 ? chalk.cyan('[Array]') : `[${node.map(element => hideUndefined && element === undefined ? ',' : format(element, deepeningCapacity === undefined ? -1 : deepeningCapacity - 1, propogateOptions ? options : undefined)).join(', ')}]`;
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
      return (deepeningCapacity ?? -1) === 0 ? chalk.cyan('[Object]') : `{ ${Object.entries(node).map(([key, value]) => hideUndefined && value === undefined ? ofKey(key, keyFormat, keyPredicate) : `${ofKey(key, keyFormat, keyPredicate)}: ${format(value, deepeningCapacity === undefined ? -1 : deepeningCapacity - 1, propogateOptions ? options : undefined)}`).join(', ')} }`;
    case 'string':
      return stringStyle === 'key' ? ofKey(node, keyFormat, keyPredicate) : ofString(node);
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
interface Konsol {
  format: (...parts: any[]) => string,
  formatWithOptions: (options: Partial<FormattingOptions>, ...parts: any[]) => string,
  formatFunctionCall: typeof ofFunctionCall;
  strip: (input: string) => string,
  substitute: typeof substitute,
  (message?: any, ...optionalParams: any[]): string;
}

const konsol: Konsol & { hooks: Konsol.Emitter } & Console = Object.assign(substitute, { hooks: new Konsol.Emitter() }, {
  format: (...parts: any[]) => parts.map(part => format(part)).join(''),
  formatWithOptions: (options: Partial<FormattingOptions>, ...parts: any[]) => parts.map(part => format(part, -1, options)).join(''),
  formatFunctionCall: ofFunctionCall,
  substitute,
  strip: (input: string) => input.replace(/[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d\/#&.:=?%@~_]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-ntqry=><~]))/g, ''),

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

  const chars = [...jsonLike.split(''), ','];
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const rest = chars.slice(i + 1).join('');
    // konsol.log(' >> ', format(char));
    // konsol.log('   >> rest: ', format(rest));
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
          const match = rest.match(/^(?:\.\.\.)[a-zA-Z$_][a-zA-Z0-9$_]*/m);
          if (match !== null) {
            heap.push(match[0]);
            i += match[0].length;
          }
        }

        bracket === '[' ? pointer.push(heap[0]) : pointer[heap[0]] = [...shhoddy, heap[1], undefined][0];
      }
      heap = [''];
    } else {

      const quoteMatch = (char + rest).match(/^(?:"(?:[^\\"]|\\")*"|'(?:[^\\']|\\')*'|`(?:[^\\`]|\\`)*`)/m);
      if (quoteMatch !== null) {
        const old = heap.pop();
        heap.push(old + quoteMatch[0]);
        i += quoteMatch[0].length - 1;
      } else {
        const idMatch = (char + rest).match(/^(?:\.\.\.)?[a-zA-Z$_][a-zA-Z0-9$_]*/m);
        if (idMatch !== null) {
          const old = heap.pop();
          heap.push(old + idMatch[0]);
          i += idMatch[0].length - 1;
        }
      }
    }
    // konsol.log('   >> heap: ', heap);
    // konsol.log('   >> ptrs: ', pointers);
    // konsol.log('   >> rslt: ', result);
  }

  return result;
};