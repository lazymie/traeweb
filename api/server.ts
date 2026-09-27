/**
 * 本地开发服务器入口
 */
import app from './app.js';
import { initDb } from './src/db/index.js';

const PORT = process.env.PORT || 3001;

async function main() {
  try {
    await initDb();
  } catch (err) {
    console.error('[server] DB init failed, starting server anyway:', err);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server ready on port ${PORT}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

main();
