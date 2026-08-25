import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TLColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/services/auth';
import { fetchPosts } from '@/services/posts';
import type { Post } from '@/services/posts';
import { upsertProfile, getLoungeMembers } from '@/services/lounge';

const AVATAR_COLORS = ['#2c7873', '#8e44ad', '#c0392b', '#3d7ebf', '#b05e8a', '#e67e22', '#27ae60'];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const TABS = ['Posts', 'Likes', 'Resources', 'Badges'] as const;
type Tab = (typeof TABS)[number];

const BANNER_EMOJIS = ['🎒', '📓', '✏️', '📎', '🍎', '🖊️', '📐', '🗂️'];
const BANNER_POSITIONS = [
  { top: 8, left: 18 }, { top: 22, left: 80 }, { top: 4, left: 160 },
  { top: 18, left: 230 }, { top: 6, left: 300 }, { top: 24, left: 340 },
  { top: 10, left: 50 }, { top: 20, left: 120 },
];

export default function ProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [draftBio, setDraftBio] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [loungeMembers, setLoungeMembers] = useState<any[]>([]);
  const [loungeVisible, setLoungeVisible] = useState(false);
  const [draftFirstName, setDraftFirstName] = useState('');
  const [draftLastName, setDraftLastName] = useState('');
  const [draftUsername, setDraftUsername] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [customUsername, setCustomUsername] = useState('');

  const bioRef = useRef<TextInput>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      setEmail(user.email ?? '');
      const meta = user.user_metadata ?? {};
      const fn = meta.first_name ?? '';
      const ln = meta.last_name ?? '';
      const un = meta.username ?? '';
      const b = meta.bio ?? '';
      setFirstName(fn);
      setLastName(ln);
      setBio(b);
      setCustomUsername(un);
      // Always sync auth metadata to public profiles table
      await upsertProfile(user.id, { first_name: fn, last_name: ln, username: un, bio: b });
      const members = await getLoungeMembers(user.id);
      setLoungeMembers(members);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (activeTab === 'Posts' && userId) loadPosts();
  }, [activeTab, userId]);

  useEffect(() => {
    if (!userId || (!firstName && !lastName)) return;
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Teacher';
    (async () => {
      // Update by author_id (normal path) and by old name as fallback for legacy rows
      await Promise.all([
        supabase.from('posts').update({ author: displayName, author_id: userId }).eq('author_id', userId),
        supabase.from('posts').update({ author: displayName, author_id: userId }).eq('author', 'First'),
        supabase.from('replies').update({ author: displayName, author_id: userId }).eq('author_id', userId),
        supabase.from('replies').update({ author: displayName, author_id: userId }).eq('author', 'First'),
      ]);
    })();
  }, [userId, firstName, lastName]);

  const loadPosts = async () => {
    setPostsLoading(true);
    const { data } = await fetchPosts();
    setPosts((data ?? []).filter(p => p.author_id === userId));
    setPostsLoading(false);
  };

  const startEditBio = () => {
    setDraftBio(bio);
    setEditingBio(true);
    setTimeout(() => bioRef.current?.focus(), 100);
  };

  const saveBio = async () => {
    setSavingBio(true);
    await Promise.all([
      supabase.auth.updateUser({ data: { bio: draftBio } }),
      upsertProfile(userId, { first_name: firstName, last_name: lastName, username: customUsername, bio: draftBio }),
    ]);
    setBio(draftBio);
    setEditingBio(false);
    setSavingBio(false);
  };

  const openEditName = () => {
    setDraftFirstName(firstName);
    setDraftLastName(lastName);
    setDraftUsername(customUsername || (firstName ? `${firstName.toLowerCase()}_teacher` : ''));
    setEditNameVisible(true);
  };

  const saveNameAndUsername = async () => {
    setSavingName(true);
    const newDisplayName = [draftFirstName, draftLastName].filter(Boolean).join(' ') || 'Teacher';
    await Promise.all([
      supabase.auth.updateUser({
        data: { first_name: draftFirstName, last_name: draftLastName, username: draftUsername },
      }),
      upsertProfile(userId, { first_name: draftFirstName, last_name: draftLastName, username: draftUsername, bio }),
      supabase.from('posts').update({ author: newDisplayName }).eq('author_id', userId),
      supabase.from('replies').update({ author: newDisplayName }).eq('author_id', userId),
    ]);
    setFirstName(draftFirstName);
    setLastName(draftLastName);
    setCustomUsername(draftUsername);
    setSavingName(false);
    setEditNameVisible(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?';
  const username = customUsername ? `@${customUsername}` : firstName ? `@${firstName.toLowerCase()}_teacher` : '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Your Name';

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={TLColors.primary} />
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View>
      {/* Banner */}
      <Image source={require('@/assets/images/profile-banner.png')} style={styles.banner} />

      {/* Avatar + stats row */}
      <View style={styles.avatarRow}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statItem} onPress={() => setLoungeVisible(true)}>
            <Text style={styles.statCount}>{loungeMembers.length}</Text>
            <Text style={styles.statLabel}>My Lounge</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/lounge-requests')}>
            <Ionicons name="person-add-outline" size={22} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => setSettingsVisible(true)}>
            <Ionicons name="settings-outline" size={24} color="#111" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Name & username */}
      <View style={styles.nameSection}>
        <View style={styles.nameRow}>
          <Text style={styles.fullName}>{fullName}</Text>
          <TouchableOpacity onPress={openEditName} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="pencil-outline" size={18} color={TLColors.gray500} />
          </TouchableOpacity>
        </View>
        <Text style={styles.username}>{username}</Text>
      </View>

      {/* Tag chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll} contentContainerStyle={styles.tagsContent}>
        <View style={styles.chip}><Text style={styles.chipText}>Social Studies</Text></View>
        <View style={styles.chip}><Text style={styles.chipText}>7th Grade</Text></View>
        <View style={styles.chip}><Text style={styles.chipText}>10+ yrs experience</Text></View>
        <View style={styles.chip}><Text style={styles.chipText}>Mecklenburg Co.</Text></View>
      </ScrollView>

      {/* Bio */}
      <View style={styles.bioSection}>
        {editingBio ? (
          <View style={styles.bioEditBox}>
            <TextInput
              ref={bioRef}
              style={styles.bioInput}
              value={draftBio}
              onChangeText={setDraftBio}
              multiline
              placeholder="Write something about yourself…"
              placeholderTextColor={TLColors.gray500}
            />
            <View style={styles.bioActions}>
              <TouchableOpacity onPress={() => setEditingBio(false)} style={styles.bioCancel}>
                <Text style={styles.bioCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveBio} style={styles.bioSave} disabled={savingBio}>
                <Text style={styles.bioSaveText}>{savingBio ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={startEditBio} activeOpacity={0.75}>
            {bio ? (
              <Text style={styles.bioText}>{bio}</Text>
            ) : (
              <Text style={styles.bioPlaceholder}>Tap to add a bio…</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>{initials}</Text>
        </View>
        <View style={styles.postMeta}>
          <Text style={styles.postAuthor}>{fullName}</Text>
          <Text style={styles.postTopic}>{item.topic}</Text>
        </View>
      </View>
      <Text style={styles.postText}>{item.text}</Text>
    </View>
  );

  const renderEmpty = () => {
    if (postsLoading) return <ActivityIndicator style={{ marginTop: 40 }} color={TLColors.primary} />;
    if (activeTab === 'Posts') return <Text style={styles.emptyText}>No posts yet</Text>;
    return <Text style={styles.emptyText}>Coming soon</Text>;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Lounge members modal */}
      <Modal visible={loungeVisible} transparent animationType="slide" onRequestClose={() => setLoungeVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setLoungeVisible(false)}>
          <Pressable style={styles.settingsSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>My Lounge ({loungeMembers.length})</Text>
            {loungeMembers.length === 0 ? (
              <Text style={{ color: '#aaa', fontStyle: 'italic', fontSize: 14, marginTop: 8 }}>
                No one in your lounge yet. Invite teachers from Discover!
              </Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {loungeMembers.map(m => {
                  const name = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.username || 'Teacher';
                  const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={styles.loungeRow}
                      onPress={() => { setLoungeVisible(false); router.push(`/user/${m.id}`); }}>
                      <View style={[styles.loungeAvatar, { backgroundColor: avatarColor(m.id) }]}>
                        <Text style={styles.loungeAvatarText}>{initials}</Text>
                      </View>
                      <View>
                        <Text style={styles.loungeName}>{name}</Text>
                        {m.username ? <Text style={styles.loungeUsername}>@{m.username}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Settings sheet */}
      <Modal visible={settingsVisible} transparent animationType="slide" onRequestClose={() => setSettingsVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSettingsVisible(false)}>
          <Pressable style={styles.settingsSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Settings</Text>
            <TouchableOpacity style={styles.sheetRow} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={22} color={TLColors.danger} />
              <Text style={styles.sheetRowTextDanger}>Sign Out</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit name/username modal */}
      <Modal visible={editNameVisible} transparent animationType="fade" onRequestClose={() => setEditNameVisible(false)}>
        <Pressable style={styles.editNameOverlay} onPress={() => setEditNameVisible(false)}>
          <Pressable style={styles.editNameSheet} onPress={() => {}}>
            <Text style={styles.editNameTitle}>Edit Profile</Text>
            <Text style={styles.editNameLabel}>First Name</Text>
            <TextInput
              style={styles.editNameInput}
              value={draftFirstName}
              onChangeText={setDraftFirstName}
              placeholder="First name"
              placeholderTextColor={TLColors.gray500}
            />
            <Text style={styles.editNameLabel}>Last Name</Text>
            <TextInput
              style={styles.editNameInput}
              value={draftLastName}
              onChangeText={setDraftLastName}
              placeholder="Last name"
              placeholderTextColor={TLColors.gray500}
            />
            <Text style={styles.editNameLabel}>Username</Text>
            <View style={styles.editNameUsernameRow}>
              <Text style={styles.editNameAt}>@</Text>
              <TextInput
                style={[styles.editNameInput, { flex: 1, marginBottom: 0 }]}
                value={draftUsername}
                onChangeText={setDraftUsername}
                placeholder="username"
                placeholderTextColor={TLColors.gray500}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.editNameActions}>
              <TouchableOpacity onPress={() => setEditNameVisible(false)} style={styles.editNameCancel}>
                <Text style={styles.editNameCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveNameAndUsername} style={styles.editNameSave} disabled={savingName}>
                <Text style={styles.editNameSaveText}>{savingName ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <FlatList
        data={activeTab === 'Posts' ? posts : []}
        keyExtractor={p => p.id}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={renderEmpty()}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },

  // Banner
  banner: { width: '100%', height: 100, resizeMode: 'cover' },

  // Avatar + stats
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, marginTop: -36 },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, borderColor: '#fff', backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 74, height: 74, borderRadius: 37,
    backgroundColor: TLColors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  statsRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 16, paddingBottom: 4 },
  statItem: { alignItems: 'center' },
  statCount: { fontSize: 16, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 11, color: TLColors.gray500 },
  settingsBtn: { padding: 4 },
  settingsIcon: {},

  // Name
  nameSection: { paddingHorizontal: 20, marginTop: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fullName: { fontSize: 20, fontWeight: '700', color: '#111' },
  username: { fontSize: 14, color: TLColors.gray500, marginTop: 2 },

  // Edit name modal
  editNameOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 24 },
  editNameSheet: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  editNameTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 20 },
  editNameLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  editNameInput: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#111', marginBottom: 16,
  },
  editNameUsernameRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingLeft: 12, marginBottom: 24 },
  editNameAt: { fontSize: 15, color: '#555', marginRight: 2 },
  editNameActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  editNameCancel: { paddingHorizontal: 16, paddingVertical: 10 },
  editNameCancelText: { fontSize: 15, color: TLColors.gray500 },
  editNameSave: { backgroundColor: TLColors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  editNameSaveText: { fontSize: 15, color: '#fff', fontWeight: '600' },

  // Tags
  tagsScroll: { marginTop: 12 },
  tagsContent: { paddingHorizontal: 20, gap: 8, flexDirection: 'row' },
  chip: {
    borderWidth: 1.5, borderColor: TLColors.primary, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  chipText: { fontSize: 13, color: TLColors.primary, fontWeight: '500' },

  // Bio
  bioSection: { paddingHorizontal: 20, marginTop: 16 },
  bioText: { fontSize: 14, color: '#333', lineHeight: 20 },
  bioPlaceholder: { fontSize: 14, color: TLColors.gray500, fontStyle: 'italic' },
  bioEditBox: {
    borderWidth: 1, borderColor: TLColors.border, borderRadius: 10,
    padding: 12, backgroundColor: '#fafafa',
  },
  bioInput: { fontSize: 14, color: '#111', lineHeight: 20, minHeight: 60 },
  bioActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  bioCancel: { paddingHorizontal: 14, paddingVertical: 6 },
  bioCancelText: { fontSize: 14, color: TLColors.gray500 },
  bioSave: {
    backgroundColor: TLColors.primary, borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 6,
  },
  bioSaveText: { fontSize: 14, color: '#fff', fontWeight: '600' },

  // Tabs
  tabs: { flexDirection: 'row', marginTop: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: TLColors.primary },
  tabText: { fontSize: 13, color: TLColors.gray500, fontWeight: '500' },
  tabTextActive: { color: TLColors.primary, fontWeight: '700' },

  // Posts
  postCard: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  postAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: TLColors.primary, alignItems: 'center', justifyContent: 'center',
  },
  postAvatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  postMeta: { flex: 1 },
  postAuthor: { fontSize: 14, fontWeight: '600', color: '#111' },
  postTopic: { fontSize: 12, color: TLColors.gray500 },
  postText: { fontSize: 14, color: '#333', lineHeight: 20 },

  emptyText: { textAlign: 'center', color: TLColors.gray500, fontSize: 14, marginTop: 40, fontStyle: 'italic' },

  loungeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  loungeAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  loungeAvatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  loungeName: { fontSize: 14, fontWeight: '600', color: '#111' },
  loungeUsername: { fontSize: 12, color: '#888', marginTop: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  settingsSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 40, paddingTop: 12, paddingHorizontal: 20,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 16 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  sheetRowIcon: {},
  sheetRowTextDanger: { fontSize: 15, color: TLColors.danger, fontWeight: '500' },
});
