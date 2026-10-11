import { EventEmitter } from 'events';
import type { Collector, CollectorEvents, CollectedEvent } from '@synapse/shared';

export abstract class BaseCollector extends EventEmitter implements Collector {
  abstract start(): Promise<void>;
  
  abstract stop(): Promise<void>;

  // Type-safe event emitters
  protected emitSessionUpdate(event: CollectedEvent): void {
    this.emit('session-update', event);
  }

  protected emitError(error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.emit('error', err);
  }

  // Type-safe event listeners (overriding EventEmitter's default)
  public override on<K extends keyof CollectorEvents>(event: K, listener: CollectorEvents[K]): this {
    return super.on(event, listener as any);
  }

  public override off<K extends keyof CollectorEvents>(event: K, listener: CollectorEvents[K]): this {
    return super.off(event, listener as any);
  }
}
