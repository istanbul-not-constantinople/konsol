import events from 'events';

export type Events = {
  'complete': () => void;
  'log': (formatted: string) => void;
}

export interface Emitter {
  (message?: any, ...optionalParams: any[]): string;

  on<U extends keyof Events>(event: U, listener: Events[U]): this;

  emit<U extends keyof Events>(event: U, ...args: Parameters<Events[U]>): boolean;
}

export class Emitter extends events.EventEmitter {
  constructor() {
    super();
  }
}