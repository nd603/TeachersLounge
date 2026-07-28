import { supabase } from '@/lib/supabase';

export type Post = {
  id: string;
  text: string;
  topic: string;
  author: string;
  author_id: string;
  anonymous: boolean;
  created_at: string;
};

export async function fetchPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function createPost(post: Omit<Post, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('posts').insert(post).select().single();
  return { data, error };
}

export async function deletePost(id: string) {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  return { error };
}
