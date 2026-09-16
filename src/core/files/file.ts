const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export interface FileReadResult {
  content: string;
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

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum supported size is 25 MB.`
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
 * Helper to download content as a local file.
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'application/json;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
