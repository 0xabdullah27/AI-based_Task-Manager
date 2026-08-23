import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, TransformStream, WritableStream } from 'stream/web';

// Capture Node 24 native web globals
const nativeGlobals = {
  fetch: globalThis.fetch,
  Response: globalThis.Response,
  Request: globalThis.Request,
  Headers: globalThis.Headers,
  FormData: globalThis.FormData,
  TextEncoder,
  TextDecoder,
  ReadableStream,
  TransformStream,
  WritableStream,
};

for (const [key, value] of Object.entries(nativeGlobals)) {
  if (value !== undefined) {
    Object.defineProperty(globalThis, key, {
      value,
      writable: true,
      configurable: true,
    });
  }
}
