import { Command } from './Command';

export class CommandRegistry {
  private commands = new Map<string, Command>();

  public register(command: Command): void {
    const name = command.data.name;
    if (this.commands.has(name)) {
      throw new Error(`Command with name "${name}" is already registered.`);
    }
    this.commands.set(name, command);
  }

  public get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  public getAll(): Command[] {
    return Array.from(this.commands.values());
  }
}
