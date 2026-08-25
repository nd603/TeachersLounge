import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { TLColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { getProfile, getConnectionStatus, sendLoungeRequest, deleteConnection, type ConnectionStatus } from '@/services/lounge';

const AVATAR_COLORS = ['#2c7873', '#8e44ad', '#c0392b', '#3d7ebf', '#b05e8a', '#e67e22', '#27ae60'];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('none');
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const [{ data: prof }, conn] = await Promise.all([
        getProfile(id),
        getConnectionStatus(user.id, id),
      ]);
      setProfile(prof);
      setConnectionStatus(conn.status);
      setConnectionId(conn.connectionId);
      setLoading(false);
    })();
  }, [id]);

  const handleInvite = async () => {
    if (!currentUserId || !id) return;
    setActionLoading(true);
    await sendLoungeRequest(currentUserId, id);
    setConnectionStatus('pending_sent');
    setActionLoading(false);
  };

  const handleCancelRequest = async () => {
    if (!connectionId) return;
    setActionLoading(true);
    await deleteConnection(connectionId);
    setConnectionStatus('none');
    setConnectionId(null);
    setActionLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
        </View>
        <ActivityIndicator style={{ marginTop: 40 }} color={TLColors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
        </View>
        <Text style={styles.notFound}>Profile not found</Text>
      </SafeAreaView>
    );
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Teacher';
  const initials = fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const color = avatarColor(id ?? '');

  const renderInviteButton = () => {
    if (currentUserId === id) return null;
    if (actionLoading) return (
      <View style={styles.btnPending}><ActivityIndicator size="small" color="#888" /></View>
    );
    if (connectionStatus === 'accepted') return (
      <View style={[styles.inviteBtn, { backgroundColor: '#e8f5e9' }]}>
        <Ionicons name="checkmark-circle" size={16} color={TLColors.primary} />
        <Text style={[styles.inviteBtnText, { color: TLColors.primary }]}>In Your Lounge</Text>
      </View>
    );
    if (connectionStatus === 'pending_sent') return (
      <TouchableOpacity style={styles.btnPending} onPress={handleCancelRequest}>
        <Text style={styles.btnPendingText}>Invite Pending</Text>
      </TouchableOpacity>
    );
    if (connectionStatus === 'pending_received') return (
      <TouchableOpacity style={styles.inviteBtn} onPress={() => router.push('/lounge-requests')}>
        <Text style={styles.inviteBtnText}>Respond to Request</Text>
      </TouchableOpacity>
    );
    return (
      <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite}>
        <Text style={styles.inviteBtnText}>Invite to my lounge</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerIcons}>
          <TouchableOpacity><Ionicons name="notifications-outline" size={24} color="#111" /></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/messages')}><Ionicons name="chatbubble-outline" size={24} color="#111" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <Image source={require('@/assets/images/profile-banner.png')} style={styles.banner} />

        {/* Avatar + invite button row */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: color }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          {renderInviteButton()}
        </View>

        {/* Name */}
        <View style={styles.nameSection}>
          <Text style={styles.fullName}>{fullName}</Text>
          {profile.username ? <Text style={styles.username}>@{profile.username}</Text> : null}
        </View>

        {/* Bio */}
        {profile.bio ? (
          <View style={styles.bioSection}>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerIcons: { flexDirection: 'row', gap: 16 },
  notFound: { textAlign: 'center', marginTop: 60, color: '#aaa', fontSize: 15 },
  banner: { width: '100%', height: 120, resizeMode: 'cover' },
  avatarRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 20, marginTop: -40,
  },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, borderColor: '#fff', backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 74, height: 74, borderRadius: 37,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: TLColors.primary, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 10, marginBottom: 4,
  },
  inviteBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnPending: {
    borderWidth: 1.5, borderColor: '#ccc', borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 10, marginBottom: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  btnPendingText: { fontSize: 14, color: '#888', fontWeight: '500' },
  nameSection: { paddingHorizontal: 20, marginTop: 12 },
  fullName: { fontSize: 22, fontWeight: '700', color: '#111' },
  username: { fontSize: 14, color: '#888', marginTop: 2 },
  bioSection: { paddingHorizontal: 20, marginTop: 14 },
  bioText: { fontSize: 14, color: '#444', lineHeight: 21 },
});
