import { supabase } from '@/lib/supabase';

export async function toggleLike(
  targetId: string,
  targetType: 'post' | 'reply',
  userId: string,
): Promise<{ liked: boolean }> {
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('target_id', targetId)
    .eq('target_type', targetType)
    .maybeSingle();

  if (existing) {
    await supabase.from('likes').delete().eq('id', existing.id);
    return { liked: false };
  } else {
    await supabase.from('likes').insert({ user_id: userId, target_id: targetId, target_type: targetType });
    return { liked: true };
  }
}

export async function getLikeCounts(
  targetIds: string[],
  targetType: 'post' | 'reply',
): Promise<Record<string, number>> {
  if (targetIds.length === 0) return {};
  const { data } = await supabase
    .from('likes')
    .select('target_id')
    .in('target_id', targetIds)
    .eq('target_type', targetType);

  const counts: Record<string, number> = {};
  for (const id of targetIds) counts[id] = 0;
  for (const row of data ?? []) {
    counts[row.target_id] = (counts[row.target_id] ?? 0) + 1;
  }
  return counts;
}

export async function getUserLikedIds(
  userId: string,
  targetIds: string[],
  targetType: 'post' | 'reply',
): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set();
  const { data } = await supabase
    .from('likes')
    .select('target_id')
    .eq('user_id', userId)
    .in('target_id', targetIds)
    .eq('target_type', targetType);

  return new Set((data ?? []).map((r: any) => r.target_id));
}
