import { Event } from './Event';

export class EventRegistry {
  private events = new Map<string, Event>();

  public register(event: Event): void {
    const key = event.name;
    if (this.events.has(key)) {
      throw new Error(`Event handler for "${key}" is already registered.`);
    }
    this.events.set(key, event);
  }

  public get(name: string): Event | undefined {
    return this.events.get(name);
  }

  public getAll(): Event[] {
    return Array.from(this.events.values());
  }
}
