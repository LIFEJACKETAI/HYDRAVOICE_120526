import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const VALID_ROLES = ['user', 'admin'] as const;
const VALID_PLANS = ['free', 'starter', 'pro', 'enterprise'] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only admins can edit users
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { role, plan, name } = body as {
      role?: string;
      plan?: string;
      name?: string;
    };

    // Validate at least one field is provided
    if (role === undefined && plan === undefined && name === undefined) {
      return NextResponse.json(
        { error: 'At least one of role, plan, or name must be provided.' },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role !== undefined && !VALID_ROLES.includes(role as any)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate plan if provided
    if (plan !== undefined && !VALID_PLANS.includes(plan as any)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${VALID_PLANS.join(', ')}` },
        { status: 400 }
      );
    }

    // Prevent admin from demoting themselves
    if (id === session.user.id && role === 'user') {
      return NextResponse.json(
        { error: 'You cannot demote yourself from admin role.' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Also prevent demoting if they're already admin and trying to change their own role
    if (id === session.user.id && existingUser.role === 'admin' && role && role !== 'admin') {
      return NextResponse.json(
        { error: 'You cannot demote yourself from admin role.' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: { role?: string; plan?: string; name?: string | null } = {};
    if (role !== undefined) updateData.role = role;
    if (plan !== undefined) updateData.plan = plan;
    if (name !== undefined) updateData.name = name;

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        oauthProvider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.email} has been updated.`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Patch user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user.' },
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

    // Only admins can delete users
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account.' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user (cascades to documents, payments, sessions, accounts)
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `User ${user.email} has been deleted.`,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user.' },
      { status: 500 }
    );
  }
}
