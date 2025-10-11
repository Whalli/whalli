import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

// Create transports array
const transports: winston.transport[] = [
  // Console transport with JSON format (always enabled)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.ms(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
  }),
];

// Determine logs directory based on environment
const isProduction = process.env.NODE_ENV === 'production';
const logsDir = isProduction ? '/tmp/logs' : (process.env.LOGS_DIR || 'logs');

// Add file transports with environment-appropriate directory
try {
  // File transport for errors
  transports.push(
    new winston.transports.File({
      filename: `${logsDir}/error.log`,
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  );

  // File transport for all logs
  transports.push(
    new winston.transports.File({
      filename: `${logsDir}/combined.log`,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  );
} catch (error) {
  // If file transports fail, log to console only
  console.warn('Failed to initialize file transports, using console only:', error instanceof Error ? error.message : String(error));
}

export const winstonConfig: WinstonModuleOptions = {
  transports,
  // Default metadata
  defaultMeta: {
    service: 'whalli-api',
  },
};
