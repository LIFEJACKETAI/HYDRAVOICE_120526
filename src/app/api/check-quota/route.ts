import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

const PLAN_LIMITS: Record<string, number> = {
  free: 10000,
  echo: 10000,
  starter: 500000,
  spark: 500000,
  pro: 2000000,
  roar: 2000000,
  business: 6000000,
  chorus: 6000000,
  enterprise: 2147483647,
  hydra: 2147483647,
};

export async function POST(req: NextRequest) {
  try {
    const { characters } = await req.json() as { characters: number };

    if (!characters || typeof characters !== 'number' || characters <= 0) {
      return NextResponse.json({ error: 'Invalid characters value' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      // Guest: enforce 5000 char hard cap but no DB tracking
      if (characters > 5000) {
        return NextResponse.json({
          allowed: false,
          reason: 'Guest users are limited to 5,000 characters. Sign in for more.',
        });
      }
      return NextResponse.json({ allowed: true, remaining: 5000 - characters });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
        plan: true,
        charactersUsedThisMonth: true,
        characterLimit: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'admin') {
      return NextResponse.json({ allowed: true, remaining: -1 });
    }

    const plan = user.plan ?? 'free';
    const limit = PLAN_LIMITS[plan] ?? 10000;
    const used = user.charactersUsedThisMonth ?? 0;
    const remaining = limit - used;

    if (characters > remaining) {
      return NextResponse.json({
        allowed: false,
        reason: `Your ${plan.toUpperCase()} plan has ${remaining.toLocaleString()} characters remaining this month. You need ${characters.toLocaleString()}.`,
        remaining,
        limit,
      });
    }

    // Deduct characters atomically
    await prisma.user.update({
      where: { id: user.id },
      data: { charactersUsedThisMonth: { increment: characters } },
    });

    return NextResponse.json({
      allowed: true,
      remaining: remaining - characters,
      limit,
    });
  } catch (error) {
    console.error('[check-quota] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({
        plan: 'guest',
        limit: 5000,
        used: 0,
        remaining: 5000,
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        role: true,
        plan: true,
        charactersUsedThisMonth: true,
        characterLimit: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const plan = user.plan ?? 'free';
    const limit = user.role === 'admin' ? -1 : (PLAN_LIMITS[plan] ?? 10000);
    const used = user.charactersUsedThisMonth ?? 0;

    return NextResponse.json({
      plan,
      limit,
      used,
      remaining: limit === -1 ? -1 : limit - used,
    });
  } catch (error) {
    console.error('[check-quota] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
