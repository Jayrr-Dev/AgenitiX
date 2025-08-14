/**
 * COMPRESSION WORKER - Background compression for large history graphs
 *
 * • Offloads heavy LZ-string compression to Web Worker thread
 * • Prevents main thread blocking during large graph serialization
 * • Fallback to main thread compression if Web Workers unavailable
 * • Used for graphs exceeding compression threshold
 *
 * Keywords: web-worker, compression, background-processing, lz-string, performance
 */

import { compressToUTF16 } from "lz-string";

// Worker message types
interface CompressionRequest {
  type: "compress";
  id: string;
  data: string;
}

interface CompressionResponse {
  type: "compressed";
  id: string;
  result: string;
}

interface CompressionError {
  type: "error";
  id: string;
  error: string;
}

type WorkerMessage = CompressionRequest;
type WorkerResponse = CompressionResponse | CompressionError;

// Web Worker code
const workerCode = `
  importScripts('https://unpkg.com/lz-string@1.5.0/libs/lz-string.min.js');

  self.onmessage = function(e) {
    const { type, id, data } = e.data;

    if (type === 'compress') {
      try {
        const compressed = LZString.compressToUTF16(data);
        self.postMessage({
          type: 'compressed',
          id: id,
          result: compressed
        });
      } catch (error) {
        self.postMessage({
          type: 'error',
          id: id,
          error: error.message || 'Compression failed'
        });
      }
    }
  };
`;

// Worker instance management
let worker: Worker | null = null;
let workerBlob: Blob | null = null;
const pendingCompressions = new Map<
  string,
  {
    resolve: (result: string) => void;
    reject: (error: Error) => void;
  }
>();

/**
 * Initialize the compression worker
 */
function initWorker(): Worker | null {
  if (typeof window === "undefined" || !window.Worker) {
    return null;
  }

  try {
    if (!workerBlob) {
      workerBlob = new Blob([workerCode], { type: "application/javascript" });
    }

    const newWorker = new Worker(URL.createObjectURL(workerBlob));

    newWorker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { type, id } = e.data;
      const pending = pendingCompressions.get(id);

      if (!pending) {
        return; // Request was cancelled or timed out
      }

      pendingCompressions.delete(id);

      if (type === "compressed") {
        pending.resolve((e.data as CompressionResponse).result);
      } else if (type === "error") {
        pending.reject(new Error((e.data as CompressionError).error));
      }
    };

    newWorker.onerror = (error) => {
      console.warn("[CompressionWorker] Worker error:", error);
      // Reject all pending requests
      for (const [id, pending] of pendingCompressions) {
        pending.reject(new Error("Worker failed"));
      }
      pendingCompressions.clear();
    };

    return newWorker;
  } catch (error) {
    console.warn("[CompressionWorker] Failed to create worker:", error);
    return null;
  }
}

/**
 * Compress data using Web Worker (with fallback to main thread)
 */
export async function compressAsync(data: string): Promise<string> {
  // [Explanation], basically try Web Worker first for background compression
  if (!worker) {
    worker = initWorker();
  }

  if (worker) {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substring(2);

      // Set up timeout for the compression
      const timeout = setTimeout(() => {
        pendingCompressions.delete(id);
        reject(new Error("Compression timeout"));
      }, 10000); // 10 second timeout

      pendingCompressions.set(id, {
        resolve: (result) => {
          clearTimeout(timeout);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      const message: CompressionRequest = {
        type: "compress",
        id,
        data,
      };

      worker!.postMessage(message);
    });
  }

  // [Explanation], basically fallback to main thread compression if Web Worker unavailable
  return Promise.resolve(compressToUTF16(data));
}

/**
 * Terminate the worker and clean up resources
 */
export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }

  if (workerBlob) {
    URL.revokeObjectURL(URL.createObjectURL(workerBlob));
    workerBlob = null;
  }

  // Reject all pending requests
  for (const [id, pending] of pendingCompressions) {
    pending.reject(new Error("Worker terminated"));
  }
  pendingCompressions.clear();
}

/**
 * Check if Web Worker compression is available
 */
export function isWebWorkerAvailable(): boolean {
  return typeof window !== "undefined" && Boolean(window.Worker);
}


