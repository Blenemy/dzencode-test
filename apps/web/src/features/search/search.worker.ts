import { buildIndex, searchIndex, type SearchRequest, type SearchResponse } from './search-engine';

let index = buildIndex([]);

self.onmessage = (event: MessageEvent<SearchRequest>) => {
  const message = event.data;
  if (message.type === 'index') {
    index = buildIndex(message.documents);
    return;
  }
  const response: SearchResponse = { id: message.id, results: searchIndex(index, message.query) };
  self.postMessage(response);
};
