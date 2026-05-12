import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

const VALID_ACTIONS = [
  'clear_temp_files',
  'reset_stuck_conversions',
  'reset_stuck_documents',
  'db_stats',
  'clear_expired_sessions',
] as const;

type MaintenanceAction = (typeof VALID_ACTIONS)[number];

async function clearTempFiles(): Promise<{
  success: true;
  message: string;
  details: { deletedCount: number; freedBytes: number };
}> {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let deletedCount = 0;
  let freedBytes = 0;

  try {
    const files = await fs.readdir(uploadsDir);
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile() && stats.mtime < twentyFourHoursAgo) {
          freedBytes += stats.size;
          await fs.unlink(filePath);
          deletedCount++;
        }
      } catch {
        // Ignore individual file errors
      }
    }
  } catch {
    // Directory might not exist
  }

  return {
    success: true,
    message: `Deleted ${deletedCount} temp file(s) older than 24 hours.`,
    details: { deletedCount, freedBytes },
  };
}

async function resetStuckConversions(): Promise<{
  success: true;
  message: string;
  details: { resetCount: number };
}> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const result = await db.audioFiles.updateMany({
    where: {
      status: 'processing',
      createdAt: { lt: oneHourAgo },
    },
    data: {
      status: 'failed',
    },
  });

  return {
    success: true,
    message: `Reset ${result.count} stuck conversion(s) to failed status.`,
    details: { resetCount: result.count },
  };
}

async function resetStuckDocuments(): Promise<{
  success: true;
  message: string;
  details: { resetCount: number };
}> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const result = await db.documents.updateMany({
    where: {
      status: 'converting',
      createdAt: { lt: oneHourAgo },
    },
    data: {
      status: 'uploaded',
    },
  });

  return {
    success: true,
    message: `Reset ${result.count} stuck document(s) to uploaded status.`,
    details: { resetCount: result.count },
  };
}

async function dbStats(): Promise<{
  success: true;
  message: string;
  details: Record<string, number> & { totalRows: number };
}> {
  const [
    userCount,
    accountCount,
    sessionCount,
    verificationTokenCount,
    documentsCount,
    audioFilesCount,
    paymentsCount,
  ] = await Promise.all([
    db.user.count(),
    db.account.count(),
    db.session.count(),
    db.verificationToken.count(),
    db.documents.count(),
    db.audioFiles.count(),
    db.payments.count(),
  ]);

  const details = {
    users: userCount,
    accounts: accountCount,
    sessions: sessionCount,
    verificationTokens: verificationTokenCount,
    documents: documentsCount,
    audioFiles: audioFilesCount,
    payments: paymentsCount,
    totalRows:
      userCount +
      accountCount +
      sessionCount +
      verificationTokenCount +
      documentsCount +
      audioFilesCount +
      paymentsCount,
  };

  return {
    success: true,
    message: `Database contains ${details.totalRows} total rows across 7 tables.`,
    details,
  };
}

async function clearExpiredSessions(): Promise<{
  success: true;
  message: string;
  details: { deletedCount: number };
}> {
  const now = new Date();

  const result = await db.session.deleteMany({
    where: {
      expires: { lt: now },
    },
  });

  return {
    success: true,
    message: `Deleted ${result.count} expired session(s).`,
    details: { deletedCount: result.count },
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only admins can perform maintenance actions
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body as { action: string };

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required.' },
        { status: 400 }
      );
    }

    if (!VALID_ACTIONS.includes(action as MaintenanceAction)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    let result;

    switch (action as MaintenanceAction) {
      case 'clear_temp_files':
        result = await clearTempFiles();
        break;
      case 'reset_stuck_conversions':
        result = await resetStuckConversions();
        break;
      case 'reset_stuck_documents':
        result = await resetStuckDocuments();
        break;
      case 'db_stats':
        result = await dbStats();
        break;
      case 'clear_expired_sessions':
        result = await clearExpiredSessions();
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Maintenance action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute maintenance action.' },
      { status: 500 }
    );
  }
}
