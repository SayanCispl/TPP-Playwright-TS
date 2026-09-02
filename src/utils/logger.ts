import pino from 'pino';
import pretty from 'pino-pretty';
import path from 'node:path';
import fs from 'node:fs';

const logDir = path.resolve('reports/logs');
fs.mkdirSync(logDir, { recursive: true });

const logFile = path.join(logDir, `test-run-${process.pid}.log`);

const streams = [
  // 1. Human-readable pretty output in the terminal console
  {
    stream: pretty({
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    }),
  },
  // 2. Structured JSON logs persisted to disk
  {
    stream: pino.destination({ dest: logFile, sync: false }),
  },
];

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? 'info',
  },
  pino.multistream(streams)
);

export function logStep(message: string, data: Record<string, unknown> = {}): void {
  logger.info(data, message);
}
