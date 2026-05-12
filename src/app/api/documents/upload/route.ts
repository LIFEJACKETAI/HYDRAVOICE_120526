import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  extractText,
  getFileExtension,
  isSupportedFileType,
  saveUploadedFile,
  SUPPORTED_EXTENSIONS,
} from '@/lib/file-processing';

/**
 * POST /api/documents/upload
 *
 * Accept a file upload (PDF, TXT, DOCX), extract text, and optionally
 * store the document record in the database.
 *
 * - Authenticated users: text is extracted AND saved to the database
 * - Unauthenticated users: text is extracted and returned (no DB save)
 *
 * Request: multipart/form-data with a "file" field
 * Returns: { success: boolean, document: { id?, filename, fileType, fileSize, status, uploadDate?, textLength, textContent } }
 */
export async function POST(request: NextRequest) {
  try {
    // ── Parse multipart form data ─────────────────────────────────
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ── Validate file type ────────────────────────────────────────
    if (!isSupportedFileType(file.name)) {
      return NextResponse.json(
        { error: `Unsupported file type. Supported types: ${SUPPORTED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // ── Validate file size (max 20 MB) ────────────────────────────
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 20 MB.` },
        { status: 400 }
      );
    }

    // ── Read file buffer ──────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(new Uint8Array(arrayBuffer));

    // ── Extract text from file ────────────────────────────────────
    const extension = getFileExtension(file.name);
    let textContent: string;

    try {
      textContent = await extractText(fileBuffer, extension);
    } catch (extractError) {
      console.error('[Document Upload] Text extraction failed:', extractError);
      return NextResponse.json(
        {
          error: `Failed to extract text from ${extension.toUpperCase()} file: ${
            extractError instanceof Error ? extractError.message : 'Unknown error'
          }`,
        },
        { status: 400 }
      );
    }

    if (!textContent || textContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text content could be extracted from this file.' },
        { status: 400 }
      );
    }

    // ── Auth check (optional — unauthenticated users get text extraction only) ──
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session?.user?.id;

    if (isAuthenticated) {
      // ── Save file to disk ─────────────────────────────────────────
      let filePath: string | undefined;
      try {
        filePath = await saveUploadedFile(fileBuffer, file.name);
      } catch (saveError) {
        console.warn('[Document Upload] Could not save file to disk:', saveError);
        // Continue without saving to disk — text is already extracted
      }

      // ── Create database record ────────────────────────────────────
      const document = await db.documents.create({
        data: {
          userId: session.user.id!,
          filename: file.name,
          fileType: extension,
          fileSize: file.size,
          textContent: textContent,
          filePath: filePath || null,
          status: 'uploaded',
        },
      });

      console.log(
        `[Document Upload] Created document ${document.id}: ${file.name}, ${textContent.length} chars extracted`
      );

      return NextResponse.json({
        success: true,
        document: {
          id: document.id,
          filename: document.filename,
          fileType: document.fileType,
          fileSize: document.fileSize,
          status: document.status,
          uploadDate: document.uploadDate,
          textLength: textContent.length,
          textContent: textContent,
        },
      });
    } else {
      // ── Unauthenticated: return extracted text without saving ─────
      console.log(
        `[Document Upload] Guest upload: ${file.name}, ${textContent.length} chars extracted (not saved)`
      );

      return NextResponse.json({
        success: true,
        document: {
          id: 'guest',
          filename: file.name,
          fileType: extension,
          fileSize: file.size,
          status: 'extracted',
          textLength: textContent.length,
          textContent: textContent,
        },
      });
    }
  } catch (error) {
    console.error('[Document Upload] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
