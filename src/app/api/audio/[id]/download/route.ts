import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

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

    // Find the audio file
    const audioFile = await db.audioFiles.findUnique({
      where: { id },
      include: {
        document: {
          select: { userId: true, filename: true },
        },
      },
    });

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file not found' }, { status: 404 });
    }

    // Check ownership
    const isAdmin = (session.user as any).role === 'admin';
    if (audioFile.document.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if audio file is ready
    if (audioFile.status !== 'completed' || !audioFile.filePath) {
      return NextResponse.json(
        { error: 'Audio file is not ready for download.' },
        { status: 400 }
      );
    }

    // Read the audio file from disk
    const filePath = audioFile.filePath;
    try {
      const fileBuffer = await fs.readFile(filePath);
      const filename = path.basename(filePath);

      // Determine content type
      const ext = path.extname(filePath).toLowerCase();
      const contentType = ext === '.mp3' ? 'audio/mpeg' : ext === '.wav' ? 'audio/wav' : 'audio/mpeg';

      // Create a meaningful download filename
      const downloadName = `${audioFile.document.filename.replace(/\.[^.]+$/, '')}_${audioFile.voiceChoice}.mp3`;

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${downloadName}"`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'private, max-age=3600',
        },
      });
    } catch {
      return NextResponse.json(
        { error: 'Audio file not found on disk.' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Audio download error:', error);
    return NextResponse.json(
      { error: 'Failed to download audio file.' },
      { status: 500 }
    );
  }
}
