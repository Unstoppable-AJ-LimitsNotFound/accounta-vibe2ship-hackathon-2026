import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { readDatabase, writeDatabase } from '@/lib/db';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured yet. Please configure environment variables.' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch this user's habits from Supabase
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: true });

    if (habitsError) {
      console.error('Error fetching habits from Supabase:', habitsError);
      return NextResponse.json({ error: habitsError.message }, { status: 500 });
    }

    // Format habits to lowerCamelCase fields matching frontend interface
    const formattedHabits = (habits || []).map(h => ({
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      createdAt: h.created_at,
    }));

    // Fetch this user's completions from Supabase
    const { data: completions, error: completionsError } = await supabase
      .from('completions')
      .select('*')
      .eq('user_id', user.id);

    if (completionsError) {
      console.error('Error fetching completions from Supabase:', completionsError);
      return NextResponse.json({ error: completionsError.message }, { status: 500 });
    }

    const formattedCompletions = (completions || []).map(c => ({
      id: c.id,
      habitId: c.habit_id,
      date: c.date,
      status: c.status,
    }));

    return NextResponse.json({
      habits: formattedHabits,
      completions: formattedCompletions,
    });
  } catch (error) {
    console.error('Error in GET /api/habits:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
    const { id, name, emoji, color } = body;

    if (!name || !emoji || !color) {
      return NextResponse.json({ error: 'Missing required fields: name, emoji, or color' }, { status: 400 });
    }

    if (id) {
      // Edit mode: update existing habit (RLS policy ensures the user can only update their own)
      const { data: updatedHabit, error: updateError } = await supabase
        .from('habits')
        .update({
          name,
          emoji,
          color,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating habit in Supabase:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      const formattedHabit = {
        id: updatedHabit.id,
        name: updatedHabit.name,
        emoji: updatedHabit.emoji,
        color: updatedHabit.color,
        createdAt: updatedHabit.created_at,
      };

      return NextResponse.json({ success: true, habit: formattedHabit });
    } else {
      // Create mode: insert new habit
      const newId = `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const { data: createdHabit, error: createError } = await supabase
        .from('habits')
        .insert({
          id: newId,
          user_id: user.id,
          name,
          emoji,
          color,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating habit in Supabase:', createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      const formattedHabit = {
        id: createdHabit.id,
        name: createdHabit.name,
        emoji: createdHabit.emoji,
        color: createdHabit.color,
        createdAt: createdHabit.created_at,
      };

      return NextResponse.json({ success: true, habit: formattedHabit });
    }
  } catch (error) {
    console.error('Error in POST /api/habits:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured yet. Please configure environment variables.' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    // Delete the habit in Supabase (RLS policy ensures users can only delete their own)
    const { error: deleteError } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting habit from Supabase:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Clean up local completions associated with the deleted habit
    try {
      const db = readDatabase();
      db.completions = db.completions.filter(c => c.habitId !== id);
      writeDatabase(db);
    } catch (err) {
      console.error('Failed to clean up local completions:', err);
    }

    return NextResponse.json({ success: true, message: 'Habit deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /api/habits:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message || String(error) }, { status: 500 });
  }
}
