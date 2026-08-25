import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TLColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { getLoungeRequests, acceptLoungeRequest, deleteConnection } from '@/services/lounge';

const AVATAR_COLORS = ['#2c7873', '#8e44ad', '#c0392b', '#3d7ebf', '#b05e8a', '#e67e22', '#27ae60'];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function displayName(profile: any) {
  if (!profile) return 'Unknown';
  return [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username || 'Unknown';
}

export default function LoungeRequestsScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await load(user.id);
    })();
  }, []);

  const load = async (uid: string) => {
    setLoading(true);
    const { incoming: inc, outgoing: out } = await getLoungeRequests(uid);
    setIncoming(inc);
    setOutgoing(out);
    setLoading(false);
  };

  const handleAccept = async (connectionId: string) => {
    await acceptLoungeRequest(connectionId);
    await load(userId);
  };

  const handleDelete = async (connectionId: string) => {
    await deleteConnection(connectionId);
    await load(userId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lounge Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={TLColors.primary} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Incoming */}
          <Text style={styles.sectionLabel}>Incoming Requests</Text>
          {incoming.length === 0 ? (
            <Text style={styles.empty}>No incoming requests</Text>
          ) : incoming.map(r => {
            const name = displayName(r.profile);
            const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
            return (
              <View key={r.id} style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: avatarColor(r.sender_id) }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{name}</Text>
                  {r.profile?.username ? <Text style={styles.username}>@{r.profile.username}</Text> : null}
                </View>
                <TouchableOpacity style={styles.btnConfirm} onPress={() => handleAccept(r.id)}>
                  <Text style={styles.btnConfirmText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(r.id)}>
                  <Text style={styles.btnDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <View style={styles.divider} />

          {/* Outgoing / Pending */}
          <Text style={styles.sectionLabel}>Pending Requests</Text>
          {outgoing.length === 0 ? (
            <Text style={styles.empty}>No pending requests</Text>
          ) : outgoing.map(r => {
            const name = displayName(r.profile);
            const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
            return (
              <View key={r.id} style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: avatarColor(r.receiver_id) }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{name}</Text>
                  {r.profile?.username ? <Text style={styles.username}>@{r.profile.username}</Text> : null}
                </View>
                <View style={styles.btnPending}>
                  <Text style={styles.btnPendingText}>Pending</Text>
                </View>
                <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(r.id)}>
                  <Text style={styles.btnDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 14 },
  empty: { fontSize: 14, color: '#aaa', fontStyle: 'italic', marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 20 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#111' },
  username: { fontSize: 12, color: '#888', marginTop: 1 },
  btnConfirm: {
    backgroundColor: TLColors.primary, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  btnConfirmText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  btnDelete: {
    backgroundColor: TLColors.danger, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  btnDeleteText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  btnPending: {
    borderWidth: 1.5, borderColor: '#ccc', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  btnPendingText: { fontSize: 13, color: '#888', fontWeight: '500' },
});
