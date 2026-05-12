import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only admins can access analytics
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get total users
    const totalUsers = await db.user.count();

    // Get total documents
    const totalDocuments = await db.documents.count();

    // Get total conversions (audio files)
    const totalConversions = await db.audioFiles.count({
      where: { status: 'completed' },
    });

    // Get total revenue (sum of completed payments)
    const completedPayments = await db.payments.findMany({
      where: { status: 'completed' },
      select: { amount: true },
    });
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    // Get user plan distribution
    const usersByPlan = await db.user.groupBy({
      by: ['plan'],
      _count: { plan: true },
    });

    // Get document status distribution
    const documentsByStatus = await db.documents.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Get recent signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSignups = await db.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Get recent conversions (last 30 days)
    const recentConversions = await db.audioFiles.count({
      where: {
        status: 'completed',
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    return NextResponse.json({
      analytics: {
        totalUsers,
        totalDocuments,
        totalConversions,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        recentSignups,
        recentConversions,
        usersByPlan: usersByPlan.map((item) => ({
          plan: item.plan,
          count: item._count.plan,
        })),
        documentsByStatus: documentsByStatus.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics.' },
      { status: 500 }
    );
  }
}
