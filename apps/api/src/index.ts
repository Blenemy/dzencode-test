import { createServer } from 'node:http';
import { createApp } from './app.js';
import { corsOrigins, env } from './config/env.js';
import { logger } from './lib/logger.js';
import { disconnectApi, eventBus } from './lib/container.js';
import { tokenHelper } from './lib/tokens.js';
import { createRealtimeServer } from './realtime/socket-server.js';

const server = createServer(createApp());
const realtime = createRealtimeServer(server, {
  tokens: tokenHelper,
  events: eventBus,
  allowedOrigins: corsOrigins,
});

server.listen(env.PORT, () => {
  logger.info(`api listening on http://localhost:${env.PORT}`);
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`got ${signal}, shutting down api`);

  try {
    await realtime.close();
    await disconnectApi();
  } catch (err) {
    logger.error({ err }, 'error while disconnecting');
  }

  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
