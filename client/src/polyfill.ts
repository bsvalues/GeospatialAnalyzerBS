/**
 * Browser Compatibility Polyfills
 * 
 * This file contains polyfills for Node.js-specific APIs that are not available in browsers.
 * Import this file at the entry point of the application (main.tsx) to ensure compatibility.
 */

// Buffer polyfill using Uint8Array
class BufferPolyfill {
  static from(data: string | ArrayBuffer | ArrayBufferView, encoding?: string): Uint8Array {
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      return encoder.encode(data);
    }
    
    if (data instanceof ArrayBuffer) {
      return new Uint8Array(data);
    }
    
    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
    
    throw new Error('Unsupported data type for Buffer.from');
  }

  static isBuffer(obj: any): boolean {
    return obj instanceof Uint8Array;
  }

  static alloc(size: number, fill?: number): Uint8Array {
    const buffer = new Uint8Array(size);
    if (fill !== undefined) {
      buffer.fill(fill);
    }
    return buffer;
  }
}

// Add Buffer to the global scope
if (typeof window !== 'undefined' && !window.Buffer) {
  (window as any).Buffer = BufferPolyfill;
}

console.log('Browser compatibility polyfills loaded');