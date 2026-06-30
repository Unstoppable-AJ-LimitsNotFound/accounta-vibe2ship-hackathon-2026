import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured yet. Please configure environment variables.' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { habitId, date, completed, status } = body;

    if (!habitId || !date) {
      return NextResponse.json({ error: 'Missing required fields: habitId or date' }, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: 'Invalid date format. Expected YYYY-MM-DD' }, { status: 400 });
    }

    const completionId = `${habitId}_${date}`;

    if (status === 'completed' || status === 'skipped') {
      const { error: insertError } = await supabase
        .from('completions')
        .upsert({
          id: completionId,
          user_id: user.id,
          habit_id: habitId,
          date,
          status,
        });

      if (insertError) {
        console.error('Error inserting completion into Supabase:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    } else if (completed === true) {
      const { error: insertError } = await supabase
        .from('completions')
        .upsert({
          id: completionId,
          user_id: user.id,
          habit_id: habitId,
          date,
          status: 'completed',
        });

      if (insertError) {
        console.error('Error inserting completion into Supabase:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    } else {
      // Remove completion
      const { error: deleteError } = await supabase
        .from('completions')
        .delete()
        .eq('id', completionId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting completion from Supabase:', deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, completed, status });
  } catch (error) {
    console.error('Error in POST /api/completions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
