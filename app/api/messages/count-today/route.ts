import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MONTHLY_MESSAGE_LIMIT = 4;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = userData.id;

    // Get the start of the current month (start of day)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    // Get the start of next month for reset calculation
    const nextMonth = new Date(monthStart);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Count messages sent by user this month using count instead of fetching all records
    const { count, error: messagesError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', userId)
      .gte('created_at', monthStart.toISOString());

    if (messagesError) {
      console.error('Error counting messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to count messages' },
        { status: 500 }
      );
    }

    const messageCount = count || 0;
    const remaining = Math.max(0, MONTHLY_MESSAGE_LIMIT - messageCount);
    const limitReached = messageCount >= MONTHLY_MESSAGE_LIMIT;

    return NextResponse.json({
      count: messageCount,
      remaining,
      limitReached,
      monthlyLimit: MONTHLY_MESSAGE_LIMIT,
      resetsAt: nextMonth.toISOString()
    });
  } catch (error) {
    console.error('Error in count-today route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

