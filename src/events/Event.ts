import { ApplicationContainer } from '../bootstrap/ApplicationContainer';

export interface Event {
  name: string;
  once?: boolean;
  execute(container: ApplicationContainer, ...args: any[]): Promise<void>;
}
