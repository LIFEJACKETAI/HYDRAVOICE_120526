import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import { mkdir } from 'fs/promises';

// ─── Directory Setup ────────────────────────────────────────────────

export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
export const AUDIO_OUTPUT_DIR = path.join(process.cwd(), 'audio-output');

/**
 * Ensure required directories exist. Call this on app startup.
 */
export async function ensureDirectories(): Promise<void> {
  await mkdir(UPLOADS_DIR, { recursive: true });
  await mkdir(AUDIO_OUTPUT_DIR, { recursive: true });
}

// ─── Supported File Types ──────────────────────────────────────────

export const SUPPORTED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
} as const;

export const SUPPORTED_EXTENSIONS = ['pdf', 'txt', 'docx'] as const;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

// ─── Extractors ────────────────────────────────────────────────────

/**
 * Extract text content from a PDF file buffer.
 *
 * Uses pdfjs-dist legacy build directly. Since Next.js's bundler
 * breaks the worker resolution for pdfjs-dist, we bypass the bundler
 * using eval-based require to load the module from disk at runtime.
 */
export async function extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
  try {
    // Bypass Next.js bundler by using eval-based require
    // This ensures we load pdfjs-dist from node_modules, not from the bundled chunk
    const dynamicRequire = eval('require') as typeof require;
    const pdfjsLib = dynamicRequire('pdfjs-dist/legacy/build/pdf.mjs');
    const workerPath = dynamicRequire.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');

    // Set the worker source before any getDocument calls
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;

    const data = new Uint8Array(fileBuffer);
    const doc = await pdfjsLib.getDocument({ data, verbosity: 0 }).promise;

    const textParts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      textParts.push(pageText);
    }

    const fullText = textParts.join('\n\n').trim();
    return fullText;
  } catch (error) {
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract text content from a DOCX file buffer.
 */
export async function extractTextFromDOCX(fileBuffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value.trim();
  } catch (error) {
    throw new Error(
      `Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract text content from a plain text file buffer.
 */
export async function extractTextFromTXT(fileBuffer: Buffer): Promise<string> {
  try {
    return fileBuffer.toString('utf-8').trim();
  } catch (error) {
    throw new Error(
      `Failed to read text file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Route to the correct extractor based on file extension.
 */
export async function extractText(
  fileBuffer: Buffer,
  extension: string
): Promise<string> {
  const ext = extension.toLowerCase().replace('.', '');

  switch (ext) {
    case 'pdf':
      return extractTextFromPDF(fileBuffer);
    case 'docx':
      return extractTextFromDOCX(fileBuffer);
    case 'txt':
      return extractTextFromTXT(fileBuffer);
    default:
      throw new Error(`Unsupported file type: ${ext}. Supported types: ${SUPPORTED_EXTENSIONS.join(', ')}`);
  }
}

/**
 * Get file extension from a filename.
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase().replace('.', '');
}

/**
 * Check if a file extension is supported.
 */
export function isSupportedFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * Save an uploaded file to the uploads directory.
 * Returns the file path.
 */
export async function saveUploadedFile(
  fileBuffer: Buffer,
  filename: string
): Promise<string> {
  await ensureDirectories();

  // Generate a unique filename to avoid collisions
  const ext = getFileExtension(filename);
  const baseName = path.basename(filename, `.${ext}`);
  const timestamp = Date.now();
  const safeName = `${baseName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${timestamp}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, safeName);

  await fs.writeFile(filePath, fileBuffer);
  return filePath;
}

/**
 * Delete a file from the filesystem.
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // File might already be deleted, ignore errors
  }
}

/**
 * Get file size in bytes.
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}
