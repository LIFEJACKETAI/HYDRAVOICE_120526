import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { isValidVoiceChoice, getVoiceById } from '@/lib/voices';
import { processDocumentToAudio } from '@/lib/tts';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { document_id, voice_choice } = body;

    // Validate input
    if (!document_id || !voice_choice) {
      return NextResponse.json(
        { error: 'document_id and voice_choice are required' },
        { status: 400 }
      );
    }

    // Validate voice choice
    if (!isValidVoiceChoice(voice_choice)) {
      return NextResponse.json(
        { error: 'Invalid voice choice. Please select from available voices.' },
        { status: 400 }
      );
    }

    const voiceProfile = getVoiceById(voice_choice);
    if (!voiceProfile) {
      return NextResponse.json(
        { error: 'Voice profile not found.' },
        { status: 400 }
      );
    }

    // Find the document
    const document = await db.documents.findUnique({
      where: { id: document_id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check ownership
    const isAdmin = (session.user as any).role === 'admin';
    if (document.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if document has text content
    if (!document.textContent || document.textContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'Document has no extractable text content.' },
        { status: 400 }
      );
    }

    // Update document status to "converting"
    await db.documents.update({
      where: { id: document_id },
      data: { status: 'converting' },
    });

    // Create audio file record
    const audioFile = await db.audioFiles.create({
      data: {
        documentId: document_id,
        voiceChoice: voice_choice,
        fileUrl: '',
        status: 'processing',
      },
    });

    try {
      // Process text to audio
      const outputFileName = `${document.id}_${audioFile.id}_${voiceProfile.sdkVoice}.wav`;
      const result = await processDocumentToAudio(
        document.textContent,
        voiceProfile.sdkVoice,
        1.0,
        outputFileName
      );

      // Update audio file record with results
      await db.audioFiles.update({
        where: { id: audioFile.id },
        data: {
          fileUrl: `/api/audio/${audioFile.id}/download`,
          filePath: result.filePath,
          duration: result.duration,
          fileSize: result.fileSize,
          status: 'completed',
        },
      });

      // Update document status to "converted"
      await db.documents.update({
        where: { id: document_id },
        data: { status: 'converted' },
      });

      return NextResponse.json({
        success: true,
        audioFile: {
          id: audioFile.id,
          voiceChoice: voice_choice,
          voiceName: voiceProfile.name,
          fileUrl: `/api/audio/${audioFile.id}/download`,
          duration: result.duration,
          fileSize: result.fileSize,
          status: 'completed',
        },
      });
    } catch (conversionError) {
      // Update records to reflect failure
      await db.audioFiles.update({
        where: { id: audioFile.id },
        data: { status: 'failed' },
      });

      await db.documents.update({
        where: { id: document_id },
        data: { status: 'conversion_failed' },
      });

      console.error('Audio conversion error:', conversionError);
      return NextResponse.json(
        { error: 'Audio conversion failed. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Convert endpoint error:', error);
    return NextResponse.json(
      { error: 'An error occurred during conversion.' },
      { status: 500 }
    );
  }
}
