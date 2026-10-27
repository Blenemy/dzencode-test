import { buildCsv, type CsvRequest } from './csv';

self.onmessage = (event: MessageEvent<CsvRequest>) => {
  self.postMessage(buildCsv(event.data));
};
