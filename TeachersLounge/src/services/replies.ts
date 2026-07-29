import { supabase } from '@/lib/supabase';

export async function fetchReplies(postId: string) {
  const { data, error } = await supabase
    .from('replies')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  return { data, error };
}

export async function createReply(reply: {
  post_id: string;
  text: string;
  author: string;
  author_id: string;
  parent_reply_id?: string | null;
}) {
  const { data, error } = await supabase.from('replies').insert(reply).select().single();
  return { data, error };
}
