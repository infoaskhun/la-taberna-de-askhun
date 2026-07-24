import { ApplicationContainer } from './ApplicationContainer';
import { StartupManager } from './StartupManager';

export class ApplicationBootstrap {
  private container: ApplicationContainer;
  private startupManager: StartupManager;

  constructor() {
    this.container = new ApplicationContainer();
    this.startupManager = new StartupManager(this.container);
  }

  public async start(): Promise<void> {
    try {
      console.log('Bootstrapping application...');
      await this.startupManager.runStartupSequence();
    } catch (error) {
      console.error('FATAL: Application failed to start:', error);
      process.exit(1);
    }
  }

  public getContainer(): ApplicationContainer {
    return this.container;
  }
}
