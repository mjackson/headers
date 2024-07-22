import { Readable } from 'node:stream';
import busboy from '@fastify/busboy';

import { MultipartMessage } from '../messages.js';

export function parse(message: MultipartMessage): Promise<number> {
  let stream = new Readable({
    read() {
      for (let chunk of message.generateChunks()) {
        this.push(chunk);
      }
      this.push(null);
    },
  });

  return new Promise((resolve, reject) => {
    let start = performance.now();

    let bb = new busboy.Busboy({
      headers: { 'content-type': `multipart/form-data; boundary=${message.boundary}` },
      limits: { fileSize: Infinity },
    });

    bb.on('field', () => {});

    bb.on('file', (_name, stream) => {
      stream.resume();
    });

    bb.on('error', reject);

    bb.on('finish', () => {
      resolve(performance.now() - start);
    });

    stream.pipe(bb);
  });
}