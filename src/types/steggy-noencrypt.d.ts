declare module 'steggy-noencrypt' {
  export function encode(imageBuffer: Uint8Array, message: string): Uint8Array;
  export function decode(imageBuffer: Uint8Array): string;
} 