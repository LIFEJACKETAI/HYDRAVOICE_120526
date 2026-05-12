import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { deleteFile } from '@/lib/file-processing';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const document = await db.documents.findUnique({
      where: { id },
      include: {
        audioFiles: true,
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Users can only access their own documents (unless admin)
    const isAdmin = (session.user as any).role === 'admin';
    if (document.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      document: {
        id: document.id,
        filename: document.filename,
        fileType: document.fileType,
        fileSize: document.fileSize,
        textContent: document.textContent,
        status: document.status,
        uploadDate: document.uploadDate,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        audioFiles: document.audioFiles.map((af) => ({
          id: af.id,
          voiceChoice: af.voiceChoice,
          fileUrl: af.fileUrl,
          duration: af.duration,
          fileSize: af.fileSize,
          status: af.status,
          createdAt: af.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve document.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const document = await db.documents.findUnique({
      where: { id },
      include: { audioFiles: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Users can only delete their own documents (unless admin)
    const isAdmin = (session.user as any).role === 'admin';
    if (document.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete associated audio files from disk
    for (const audioFile of document.audioFiles) {
      if (audioFile.filePath) {
        await deleteFile(audioFile.filePath);
      }
    }

    // Delete uploaded file from disk
    if (document.filePath) {
      await deleteFile(document.filePath);
    }

    // Delete document (cascades to audio files in DB)
    await db.documents.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Document and associated audio files deleted.',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document.' },
      { status: 500 }
    );
  }
}
