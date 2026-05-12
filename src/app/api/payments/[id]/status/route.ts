import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

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

    const payment = await db.payments.findUnique({
      where: { id },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check ownership (unless admin)
    const isAdmin = (session.user as any).role === 'admin';
    if (payment.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        stripeSessionId: payment.stripeSessionId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        plan: payment.plan,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment status.' },
      { status: 500 }
    );
  }
}
