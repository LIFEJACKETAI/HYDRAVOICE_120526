import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only admins can access system health
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Calculate system uptime
    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    // Get database file size
    let dbSizeBytes = 0;
    try {
      const dbPath = path.join(process.cwd(), 'db', 'database.sqlite');
      const dbStats = await fs.stat(dbPath);
      dbSizeBytes = dbStats.size;
    } catch {
      // DB file might be in a different location
      try {
        const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
        const dbStats = await fs.stat(dbPath);
        dbSizeBytes = dbStats.size;
      } catch {
        // Ignore if we can't find the DB file
      }
    }

    // Get uploads directory size
    let uploadsSizeBytes = 0;
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const uploadFiles = await fs.readdir(uploadsDir);
      for (const file of uploadFiles) {
        try {
          const stats = await fs.stat(path.join(uploadsDir, file));
          if (stats.isFile()) uploadsSizeBytes += stats.size;
        } catch {
          // Ignore individual file errors
        }
      }
    } catch {
      // Directory might not exist yet
    }

    // Get audio output directory size
    let audioOutputSizeBytes = 0;
    try {
      const audioDir = path.join(process.cwd(), 'audio-output');
      const audioFiles = await fs.readdir(audioDir);
      for (const file of audioFiles) {
        try {
          const stats = await fs.stat(path.join(audioDir, file));
          if (stats.isFile()) audioOutputSizeBytes += stats.size;
        } catch {
          // Ignore individual file errors
        }
      }
    } catch {
      // Directory might not exist yet
    }

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    return NextResponse.json({
      systemHealth: {
        uptime: {
          seconds: Math.round(uptimeSeconds),
          formatted: `${days}d ${hours}h ${minutes}m`,
        },
        database: {
          sizeBytes: dbSizeBytes,
          sizeMB: Math.round((dbSizeBytes / 1024 / 1024) * 100) / 100,
        },
        storage: {
          uploadsBytes: uploadsSizeBytes,
          uploadsMB: Math.round((uploadsSizeBytes / 1024 / 1024) * 100) / 100,
          audioOutputBytes: audioOutputSizeBytes,
          audioOutputMB: Math.round((audioOutputSizeBytes / 1024 / 1024) * 100) / 100,
          totalBytes: uploadsSizeBytes + audioOutputSizeBytes + dbSizeBytes,
          totalMB: Math.round(((uploadsSizeBytes + audioOutputSizeBytes + dbSizeBytes) / 1024 / 1024) * 100) / 100,
        },
        memory: {
          process: {
            heapUsedMB: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
            heapTotalMB: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
            rssMB: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
          },
          system: {
            totalMB: Math.round((totalMemory / 1024 / 1024) * 100) / 100,
            freeMB: Math.round((freeMemory / 1024 / 1024) * 100) / 100,
            usedPercent: Math.round(((1 - freeMemory / totalMemory) * 100) * 100) / 100,
          },
        },
        nodeVersion: process.version,
        platform: process.platform,
      },
    });
  } catch (error) {
    console.error('System health error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve system health.' },
      { status: 500 }
    );
  }
}
