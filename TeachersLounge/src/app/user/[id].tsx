import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

  const renderInviteButton = () => {
    if (currentUserId === id) return null;
    if (actionLoading) return (
      <View style={styles.inviteBtn}><ActivityIndicator size="small" color="#fff" /></View>
    );
    if (connectionStatus === 'accepted') return (
      <View style={[styles.inviteBtn, styles.inviteBtnAccepted]}>
        <Ionicons name="checkmark-circle" size={16} color={TLColors.primary} />
        <Text style={[styles.inviteBtnText, { color: TLColors.primary }]}>In Your Lounge</Text>
      </View>
    );
    if (connectionStatus === 'pending_sent') return (
      <TouchableOpacity style={styles.inviteBtnPending} onPress={handleCancelRequest}>
        <Text style={styles.inviteBtnPendingText}>Invite Pending</Text>
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
        </View>
        <ActivityIndicator style={{ marginTop: 60 }} color={TLColors.primary} />
      </SafeAreaView>
    );
  }

  const p = profile ?? {};
  const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Teacher';
  const initials = fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const color = avatarColor(id ?? '');

  // Build tag chips from profile fields that exist
  const chips: string[] = [];
  if (p.subject) chips.push(p.subject);
  if (p.grade) chips.push(p.grade);
  if (p.experience) chips.push(p.experience);
  if (p.district) chips.push(p.district);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => router.push('/lounge-requests')}>
            <Ionicons name="notifications-outline" size={24} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/messages')}>
            <Ionicons name="chatbubble-outline" size={24} color="#111" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <Image source={require('@/assets/images/profile-banner.png')} style={styles.banner} />

        {/* Avatar */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: color }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
        </View>

        {/* Name + username + invite button */}
        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fullName}>{fullName}</Text>
              {p.username ? <Text style={styles.username}>@{p.username}</Text> : null}
            </View>
            {renderInviteButton()}
          </View>
        </View>

        {/* Tag chips */}
        {chips.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
            {chips.map(chip => (
              <View key={chip} style={styles.chip}>
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Bio */}
        {p.bio ? (
          <View style={styles.bioSection}>
            <Text style={styles.bioText}>{p.bio}</Text>
          </View>
        ) : null}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Uploaded Resources & Links */}
        <View style={styles.resourcesSection}>
          <Text style={styles.resourcesTitle}>Uploaded Resources & Links</Text>
          <View style={styles.resourcesEmpty}>
            <Text style={styles.resourcesEmptyText}>No resources uploaded yet</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
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

  banner: { width: '100%', height: 130, resizeMode: 'cover' },

  avatarRow: {
    paddingHorizontal: 20, marginTop: -44,
  },
  avatarWrap: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, borderColor: '#fff', backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 82, height: 82, borderRadius: 41,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '700' },

  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: TLColors.primary, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  inviteBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  inviteBtnAccepted: { backgroundColor: '#e8f5e9' },
  inviteBtnPending: {
    borderWidth: 1.5, borderColor: '#ccc', borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 12,
    alignItems: 'center',
  },
  inviteBtnPendingText: { fontSize: 14, color: '#888', fontWeight: '500' },

  nameSection: { paddingHorizontal: 20, marginTop: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  fullName: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 2 },
  username: { fontSize: 15, color: '#555', fontWeight: '500' },

  chipsScroll: { marginTop: 14 },
  chipsContent: { paddingHorizontal: 20, gap: 8, flexDirection: 'row' },
  chip: {
    borderWidth: 1.5, borderColor: '#222', borderRadius: 50,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  chipText: { fontSize: 13, color: '#222', fontWeight: '500' },

  bioSection: { paddingHorizontal: 20, marginTop: 18 },
  bioText: { fontSize: 14, color: '#333', lineHeight: 22 },

  divider: { height: 1, backgroundColor: '#f0f0f0', marginTop: 24 },

  resourcesSection: { paddingHorizontal: 20, paddingTop: 20 },
  resourcesTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 16 },
  resourcesEmpty: {
    borderWidth: 1.5, borderColor: '#e0e0e0', borderStyle: 'dashed',
    borderRadius: 12, padding: 24, alignItems: 'center',
  },
  resourcesEmptyText: { fontSize: 13, color: '#aaa', fontStyle: 'italic' },
});
