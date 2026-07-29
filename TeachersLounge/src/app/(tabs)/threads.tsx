import { useEffect, useRef, useState } from 'react';
import {
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

import { TLColors } from '@/constants/theme';
import { PostCard } from '@/components/PostCard';
import { ReplyCard, type Reply } from '@/components/ReplyCard';
import { type Post, fetchPosts, createPost } from '@/services/posts';
import { supabase } from '@/lib/supabase';

const TABS = ['My Feed', 'Mental Health', 'Free Resources', 'Administration', 'Funny', 'Parents'];
const TOPICS = ['Mental Health', 'Class Management', 'Administration', 'Resources', 'Funny'];

export default function ThreadsScreen() {
  const [activeTab, setActiveTab] = useState('My Feed');
  const [createVisible, setCreateVisible] = useState(false);
  const [postText, setPostText] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [replyText, setReplyText] = useState('');
  const replyInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const { data } = await fetchPosts();
    if (data) setPosts(data);
    setLoading(false);
  };

  const handlePost = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await createPost({
      text: postText.trim(),
      topic: selectedTopic,
      author: anonymous ? 'Anonymous' : (user?.user_metadata?.first_name ?? 'Teacher'),
      author_id: user?.id ?? '',
      anonymous,
    });
    if (error || !data) return;
    setPosts(prev => [data, ...prev]);
    setPostText('');
    setSelectedTopic('');
    setTopicDropdownOpen(false);
    setAnonymous(false);
    setCreateVisible(false);
    setViewingPost(data);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !viewingPost) return;
    const { data: { user } } = await supabase.auth.getUser();
    const newReply: Reply = {
      id: Date.now().toString(),
      post_id: viewingPost.id,
      text: replyText.trim(),
      author: user?.user_metadata?.first_name ?? 'Teacher',
      author_id: user?.id ?? '',
      created_at: new Date().toISOString(),
    };
    setReplies(prev => ({
      ...prev,
      [viewingPost.id]: [prev[viewingPost.id] ?? [], newReply].flat(),
    }));
    setReplyText('');
  };

  const filteredPosts = activeTab === 'My Feed'
    ? posts
    : posts.filter(p => p.topic === activeTab);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)} ${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}${d.getHours() < 12 ? 'am' : 'pm'}`;
  };

  const Header = () => (
    <>
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <Text style={styles.headerEmoji}>☕</Text>
          <Text style={styles.headerTitle}>{"Teachers'\nLounge"}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity><Text style={styles.icon}>🔔</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.icon}>💬</Text></TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchText}>Search for posts...</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn}><Text style={styles.filterIcon}>⚙️</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => { setActiveTab(tab); setViewingPost(null); }}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.tabDivider} />
    </>
  );

  const createPostModal = (
    <Modal visible={createVisible} animationType="slide" transparent>
      <Pressable style={styles.modalOverlay} onPress={() => setCreateVisible(false)} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Create Post</Text>
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setTopicDropdownOpen(!topicDropdownOpen)}>
            <Text style={[styles.dropdownText, !selectedTopic && { color: TLColors.gray500 }]}>
              {selectedTopic || 'Add a topic tag'}
            </Text>
            <Text style={styles.dropdownArrow}>▾</Text>
          </TouchableOpacity>
          {topicDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {TOPICS.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.dropdownItem, selectedTopic === t && styles.dropdownItemSelected]}
                  onPress={() => { setSelectedTopic(t); setTopicDropdownOpen(false); }}>
                  <Text style={[styles.dropdownItemText, selectedTopic === t && styles.dropdownItemTextSelected]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <TextInput
          style={styles.postInput}
          placeholder="Type here..."
          placeholderTextColor={TLColors.gray500}
          multiline
          value={postText}
          onChangeText={setPostText}
        />
        <View style={styles.anonRow}>
          <Text style={styles.anonLabel}>Post anonymously as:</Text>
          <View style={styles.anonName}><Text style={styles.anonNameText}>HistoryTeacher1</Text></View>
          <TouchableOpacity
            style={[styles.toggle, anonymous && styles.toggleOn]}
            onPress={() => setAnonymous(!anonymous)}>
            <View style={[styles.toggleThumb, anonymous && styles.toggleThumbOn]} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.btnPost, !postText.trim() && styles.btnPostDisabled]}
          disabled={!postText.trim()}
          onPress={handlePost}>
          <Text style={styles.btnPostText}>Post</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  // Post detail view
  if (viewingPost) {
    const postReplies = replies[viewingPost.id] ?? [];
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ScrollView style={styles.feed}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { setViewingPost(null); setReplyText(''); }}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <PostCard post={viewingPost} date={formatDate(viewingPost.created_at)} onReply={() => replyInputRef.current?.focus()} />
          <View style={styles.divider} />
          {postReplies.map(reply => (
            <ReplyCard key={reply.id} reply={reply} date={formatDate(reply.created_at)} />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
        <View style={styles.replyBar}>
          <TextInput
            ref={replyInputRef}
            style={styles.replyInput}
            placeholder="Write your message"
            placeholderTextColor={TLColors.gray500}
            value={replyText}
            onChangeText={setReplyText}
            onSubmitEditing={handleReply}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !replyText.trim() && { opacity: 0.4 }]}
            onPress={handleReply}
            disabled={!replyText.trim()}>
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.fab} onPress={() => setCreateVisible(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
        {createPostModal}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.feed}>
        {/* Weekly Community Prompt */}
        <View style={styles.promptCard}>
          <Text style={styles.promptTitle}>Weekly Community Prompt</Text>
          <View style={styles.promptMeta}>
            <View style={styles.promptTag}><Text style={styles.promptTagText}>Class Management</Text></View>
            <Text style={styles.promptDate}>Week of 3/1/26 – 3/9/26</Text>
          </View>
          <Text style={styles.promptQuestion}>
            What is something you started integrating into your classroom this year that made your job easier?
          </Text>
          <View style={styles.postActions}>
            <TouchableOpacity><Text style={styles.actionLabel}>···</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.actionIcon}>♡</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.actionIcon}>↪</Text></TouchableOpacity>
          </View>
        </View>
        <View style={styles.divider} />

        {loading ? (
          <View style={styles.noPostsContainer}>
            <Text style={styles.noPostsText}>Loading posts...</Text>
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.noPostsContainer}>
            <Text style={styles.noPostsText}>No posts yet — be the first to share!</Text>
          </View>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <View key={post.id}>
              <PostCard post={post} date={formatDate(post.created_at)} onPress={() => setViewingPost(post)} />
              <View style={styles.divider} />
            </View>
          ))
        ) : null}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setCreateVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {createPostModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TLColors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerLogo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerEmoji: { fontSize: 30 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: TLColors.primary, lineHeight: 18 },
  headerIcons: { flexDirection: 'row', gap: 16 },
  icon: { fontSize: 22 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f5f5f5', borderRadius: 10, padding: 10,
  },
  searchIcon: { fontSize: 14 },
  searchText: { fontSize: 14, color: '#999' },
  filterBtn: { padding: 6 },
  filterIcon: { fontSize: 20 },
  tabsScroll: { flexGrow: 0 },
  tabsContent: { paddingHorizontal: 16, gap: 4 },
  tabItem: { paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  tabText: { fontSize: 14, color: TLColors.gray500, fontWeight: '500' },
  tabTextActive: { color: TLColors.danger, fontWeight: '700' },
  tabUnderline: { height: 2, backgroundColor: TLColors.danger, width: '100%', marginTop: 4, borderRadius: 1 },
  tabDivider: { height: 1, backgroundColor: '#f0f0f0' },
  feed: { flex: 1 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 14 },
  backText: { fontSize: 16, color: TLColors.black, fontWeight: '500' },
  promptCard: { padding: 20 },
  promptTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 10 },
  promptMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  promptTag: { borderWidth: 1.5, borderColor: '#333', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3 },
  promptTagText: { fontSize: 12, color: '#333' },
  promptDate: { fontSize: 12, color: '#888' },
  promptQuestion: { fontSize: 14, color: '#222', lineHeight: 20, marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#f0f0f0' },
  noPostsContainer: { padding: 40, alignItems: 'center' },
  noPostsText: { fontSize: 14, color: TLColors.gray500, fontStyle: 'italic' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: TLColors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  fabText: { fontSize: 32, color: TLColors.white, lineHeight: 36 },
  replyBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
    backgroundColor: TLColors.white,
  },
  replyInput: {
    flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 14,
  },
  sendBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: TLColors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnText: { color: TLColors.white, fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalSheet: {
    backgroundColor: TLColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 16 },
  dropdownWrapper: { marginBottom: 12, zIndex: 10 },
  dropdown: {
    borderWidth: 1, borderColor: TLColors.gray300, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  dropdownText: { fontSize: 15, color: '#111' },
  dropdownArrow: { fontSize: 14, color: TLColors.gray500 },
  dropdownMenu: {
    position: 'absolute', top: 48, left: 0, right: 0,
    backgroundColor: TLColors.white, borderWidth: 1, borderColor: TLColors.gray300,
    borderRadius: 8, zIndex: 20,
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12 },
  dropdownItemSelected: { backgroundColor: TLColors.primary },
  dropdownItemText: { fontSize: 14, color: '#111' },
  dropdownItemTextSelected: { color: TLColors.white },
  postInput: {
    borderWidth: 1, borderColor: TLColors.gray300, borderRadius: 8,
    padding: 14, fontSize: 15, minHeight: 160, textAlignVertical: 'top',
    marginBottom: 16,
  },
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  anonLabel: { fontSize: 13, color: TLColors.gray700 },
  anonName: { borderWidth: 1, borderColor: TLColors.gray300, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  anonNameText: { fontSize: 13, color: '#111' },
  toggle: {
    width: 44, height: 24, borderRadius: 12, backgroundColor: TLColors.gray300,
    justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: TLColors.primary },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: TLColors.white },
  toggleThumbOn: { alignSelf: 'flex-end' },
  btnPost: {
    backgroundColor: TLColors.primary, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center',
  },
  btnPostDisabled: { backgroundColor: TLColors.gray300 },
  btnPostText: { color: TLColors.white, fontSize: 16, fontWeight: '600' },
});
