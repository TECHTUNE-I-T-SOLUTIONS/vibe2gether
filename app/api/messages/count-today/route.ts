import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DAILY_MESSAGE_LIMIT = 4;

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

    // Get today's date (start of day in user's timezone)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count messages sent by user today using count instead of fetching all records
    const { count, error: messagesError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', userId)
      .gte('created_at', today.toISOString());

    if (messagesError) {
      console.error('Error counting messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to count messages' },
        { status: 500 }
      );
    }

    const messageCount = count || 0;
    const remaining = Math.max(0, DAILY_MESSAGE_LIMIT - messageCount);
    const limitReached = messageCount >= DAILY_MESSAGE_LIMIT;

    return NextResponse.json({
      count: messageCount,
      remaining,
      limitReached,
      dailyLimit: DAILY_MESSAGE_LIMIT,
      resetsAt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error in count-today route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
