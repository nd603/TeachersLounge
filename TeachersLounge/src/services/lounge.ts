import { supabase } from '@/lib/supabase';

export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export async function upsertProfile(userId: string, data: {
  first_name: string;
  last_name: string;
  username?: string;
  bio?: string;
  subject?: string;
  grade?: string;
  experience?: string;
  district?: string;
}) {
  return supabase.from('profiles').upsert({ id: userId, ...data, updated_at: new Date().toISOString() });
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return { data, error };
}

export async function sendLoungeRequest(senderId: string, receiverId: string) {
  return supabase.from('lounge_connections').insert({ sender_id: senderId, receiver_id: receiverId, status: 'pending' });
}

export async function acceptLoungeRequest(connectionId: string) {
  return supabase.from('lounge_connections').update({ status: 'accepted' }).eq('id', connectionId);
}

export async function deleteConnection(connectionId: string) {
  return supabase.from('lounge_connections').delete().eq('id', connectionId);
}

export async function getConnectionStatus(currentUserId: string, otherUserId: string): Promise<{ status: ConnectionStatus; connectionId: string | null }> {
  const { data } = await supabase
    .from('lounge_connections')
    .select('id, sender_id, receiver_id, status')
    .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`);

  if (!data || data.length === 0) return { status: 'none', connectionId: null };
  const row = data[0];
  if (row.status === 'accepted') return { status: 'accepted', connectionId: row.id };
  if (row.sender_id === currentUserId) return { status: 'pending_sent', connectionId: row.id };
  return { status: 'pending_received', connectionId: row.id };
}

export async function getLoungeRequests(userId: string) {
  const { data } = await supabase
    .from('lounge_connections')
    .select('id, sender_id, receiver_id, status, created_at')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('status', 'pending');

  if (!data) return { incoming: [], outgoing: [] };

  const incoming = data.filter(r => r.receiver_id === userId);
  const outgoing = data.filter(r => r.sender_id === userId);

  // Fetch profiles for all involved users
  const userIds = [...new Set([...incoming.map(r => r.sender_id), ...outgoing.map(r => r.receiver_id)])];
  const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, username').in('id', userIds);
  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

  return {
    incoming: incoming.map(r => ({ ...r, profile: profileMap[r.sender_id] ?? null })),
    outgoing: outgoing.map(r => ({ ...r, profile: profileMap[r.receiver_id] ?? null })),
  };
}

export async function getLoungeMembers(userId: string) {
  const { data } = await supabase
    .from('lounge_connections')
    .select('id, sender_id, receiver_id')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (!data) return [];

  const memberIds = data.map(r => r.sender_id === userId ? r.receiver_id : r.sender_id);
  if (memberIds.length === 0) return [];

  const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, username').in('id', memberIds);
  return profiles ?? [];
}
