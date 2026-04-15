import pino from 'pino';

// Singleton HMR-safe — tránh tạo lại logger mỗi lần hot reload
const g = global as typeof global & { _logger?: pino.Logger };

const isDev = process.env.NODE_ENV !== 'production';

const logger: pino.Logger =
  g._logger ??
  pino({
    level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
    ...(isDev && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    }),
  });

if (isDev) g._logger = logger;

export { logger };
