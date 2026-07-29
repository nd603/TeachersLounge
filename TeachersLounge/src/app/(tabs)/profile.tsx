import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TLColors } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { signOut } from '@/services/auth';
import { fetchPosts } from '@/services/posts';
import type { Post } from '@/services/posts';

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
  const [activeTab, setActiveTab] = useState<Tab>('Posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [userId, setUserId] = useState('');

  const bioRef = useRef<TextInput>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      setEmail(user.email ?? '');
      const meta = user.user_metadata ?? {};
      setFirstName(meta.first_name ?? '');
      setLastName(meta.last_name ?? '');
      setBio(meta.bio ?? '');
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (activeTab === 'Posts' && userId) loadPosts();
  }, [activeTab, userId]);

  const loadPosts = async () => {
    setPostsLoading(true);
    const all = await fetchPosts();
    setPosts(all.filter(p => p.author_id === userId));
    setPostsLoading(false);
  };

  const startEditBio = () => {
    setDraftBio(bio);
    setEditingBio(true);
    setTimeout(() => bioRef.current?.focus(), 100);
  };

  const saveBio = async () => {
    setSavingBio(true);
    await supabase.auth.updateUser({ data: { bio: draftBio } });
    setBio(draftBio);
    setEditingBio(false);
    setSavingBio(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?';
  const username = firstName ? `@${firstName.toLowerCase()}_teacher` : '';
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
      <View style={styles.banner}>
        {BANNER_EMOJIS.map((emoji, i) => (
          <Text key={i} style={[styles.bannerEmoji, BANNER_POSITIONS[i]]}>
            {emoji}
          </Text>
        ))}
      </View>

      {/* Avatar + stats row */}
      <View style={styles.avatarRow}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statCount}>14</Text>
            <Text style={styles.statLabel}>My Lounge</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} onPress={handleSignOut}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Name & username */}
      <View style={styles.nameSection}>
        <Text style={styles.fullName}>{fullName}</Text>
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
      <FlatList
        data={activeTab === 'Posts' ? posts : []}
        keyExtractor={p => p.id}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },

  // Banner
  banner: { height: 100, backgroundColor: '#d4eef0', overflow: 'hidden', position: 'relative' },
  bannerEmoji: { position: 'absolute', fontSize: 22 },

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
  settingsIcon: { fontSize: 22 },

  // Name
  nameSection: { paddingHorizontal: 20, marginTop: 10 },
  fullName: { fontSize: 20, fontWeight: '700', color: '#111' },
  username: { fontSize: 14, color: TLColors.gray500, marginTop: 2 },

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
});
