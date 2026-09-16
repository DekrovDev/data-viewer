const MAX_TEXT_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB for text
const MAX_BINARY_FILE_SIZE_BYTES = 250 * 1024 * 1024; // 250MB for binary

export interface FileReadResult {
  content: string;
  filename: string;
  sizeBytes: number;
}

export interface BinaryFileReadResult {
  buffer: ArrayBuffer;
  filename: string;
  sizeBytes: number;
}

/**
 * Reads a user-selected File as a UTF-8 text string.
 */
export async function readTextFile(file: File): Promise<FileReadResult> {
  if (!file) {
    throw new Error('No file provided');
  }

  if (file.size > MAX_TEXT_FILE_SIZE_BYTES) {
    throw new Error(
      `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum supported text size is 25 MB.`
    );
  }

  const content = await file.text();
  return {
    content,
    filename: file.name,
    sizeBytes: file.size,
  };
}

/**
 * Reads a user-selected File as an ArrayBuffer.
 */
export async function readBinaryFile(file: File): Promise<BinaryFileReadResult> {
  if (!file) {
    throw new Error('No file provided');
  }

  if (file.size > MAX_BINARY_FILE_SIZE_BYTES) {
    throw new Error(
      `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum supported file size is 250 MB.`
    );
  }

  const buffer = await file.arrayBuffer();
  return {
    buffer,
    filename: file.name,
    sizeBytes: file.size,
  };
}

/**
 * Helper to download content or binary as a local file.
 */
export function downloadFile(
  content: string | Uint8Array | Blob,
  filename: string,
  mimeType: string = 'application/octet-stream'
): void {
  const blobContent = content instanceof Uint8Array
    ? (content.buffer as ArrayBuffer).slice(content.byteOffset, content.byteOffset + content.byteLength)
    : content;
  const blob = blobContent instanceof Blob ? blobContent : new Blob([blobContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
