import { EventEmitter } from 'events';
import type { Collector, CollectorEvents, CollectedEvent } from '@synapse/shared';

export abstract class BaseCollector extends EventEmitter implements Collector {
  abstract start(): Promise<void>;
  
  abstract stop(): Promise<void>;

  // Type-safe event emitters
  protected emitSessionUpdate(event: CollectedEvent): void {
    this.emit('session-update', event);
  }

  protected emitError(error: Error): void {
    this.emit('error', error);
  }

  // Type-safe event listeners (overriding EventEmitter's default)
  public on<K extends keyof CollectorEvents>(event: K, listener: CollectorEvents[K]): this {
    return super.on(event, listener as any);
  }

  public off<K extends keyof CollectorEvents>(event: K, listener: CollectorEvents[K]): this {
    return super.off(event, listener as any);
  }
}
