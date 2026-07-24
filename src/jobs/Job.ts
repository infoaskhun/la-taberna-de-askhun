import { ApplicationContainer } from '../bootstrap/ApplicationContainer';

export interface Job {
  name: string;
  start(container: ApplicationContainer): void;
  stop(): void;
  execute(container: ApplicationContainer): Promise<void>;
}
