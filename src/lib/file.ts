const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export interface FileReadResult {
  content: string;
  filename: string;
  sizeBytes: number;
}

/**
 * Reads a user-selected File as a UTF-8 text string.
 * Validates file size and format.
 */
export async function readJsonFile(file: File): Promise<FileReadResult> {
  if (!file) {
    throw new Error('No file provided');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum supported size is 15 MB.`);
  }

  // Check file extension if possible
  const fileNameLower = file.name.toLowerCase();
  const isLikelyJson = fileNameLower.endsWith('.json') || 
                       fileNameLower.endsWith('.txt') || 
                       file.type === 'application/json' || 
                       file.type === 'text/plain' || 
                       file.type === '';

  if (!isLikelyJson) {
    throw new Error(`Unsupported file type for "${file.name}". Please upload a .json or text file.`);
  }

  const content = await file.text();
  return {
    content,
    filename: file.name,
    sizeBytes: file.size,
  };
}

/**
 * Helper to download current JSON as a .json file.
 */
export function downloadJsonFile(content: string, filename: string = 'data.json'): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
