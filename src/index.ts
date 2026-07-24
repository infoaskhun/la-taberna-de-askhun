import { ApplicationBootstrap } from './bootstrap/ApplicationBootstrap';

const bootstrap = new ApplicationBootstrap();
bootstrap.start().catch((err) => {
  console.error('Unhandled bootstrap rejection:', err);
  process.exit(1);
});
