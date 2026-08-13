import path from 'node:path';
import { createStore } from './src/store.js';
import { createApp } from './src/app.js';

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const store = createStore(dataDir);

store.sweepExpiredOrders();
const sweep = setInterval(() => {
  store.sweepExpiredOrders();
}, 60 * 60 * 1000);
sweep.unref();

const app = createApp({ dataDir, store });
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Lettermill listening on http://localhost:${port}`);
});
