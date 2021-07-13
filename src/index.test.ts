import konsol from '.';
import fs from 'fs';

interface ITFCheck<T> {
  expected: T;
  middleware: (result: T) => T;
  cb: (result: T) => void | Promise<void>;
}

var itf = <T extends any[], R>(func: (...args: T) => R, args: T, check?: Partial<ITFCheck<R>>, timeout?: number, name?: string) => {
  const formatted = konsol.substitute('📣 %s', konsol.formatFunctionCall(func, args, { run: false, cachedResult: check?.expected, ...(name ? { name } : {}) }));
  it(formatted, (cb) => {
    const result = (check?.middleware ?? ((b) => b))(func(...args));
    (check?.expected !== undefined ? expect(result).toBe(check.expected) : true) && Promise.resolve(check?.cb?.(result));
    cb();
  }, timeout);
};

describe('📣 konsol.format', () => {
  itf(konsol.format, [], { expected: '' }, undefined, 'konsol.format');
  itf(konsol.format, [19], { expected: '19', middleware: konsol.strip }, undefined, 'konsol.format');
  itf(konsol.format, [['array', 'of', 4, 'elements']], { expected: '[\'array\', \'of\', 4, \'elements\']', middleware: konsol.strip }, undefined, 'konsol.format');
  itf(konsol.format, [{ deeply: { nested: 'object', right: { here: 'mate' } } }], { expected: '{ deeply: { nested: \'object\', right: { here: \'mate\' } } }', middleware: konsol.strip }, undefined, 'konsol.format');
  itf(konsol.format, [undefined], { expected: 'undefined', middleware: konsol.strip }, undefined, 'konsol.format');
  itf(konsol.format, [null], { expected: 'null', middleware: konsol.strip }, undefined, 'konsol.format');
});
