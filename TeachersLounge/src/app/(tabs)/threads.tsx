import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
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

import { Ionicons } from '@expo/vector-icons';
import { TLColors } from '@/constants/theme';
import { PostCard } from '@/components/PostCard';
import { ReplyCard, type Reply, REPLY_LEFT_PAD, REPLY_AVATAR_SIZE } from '@/components/ReplyCard';
import { OptionsSheet } from '@/components/OptionsSheet';
import { type Post, fetchPosts, createPost, deletePost } from '@/services/posts';
import { fetchReplies, createReply } from '@/services/replies';
import { supabase } from '@/lib/supabase';

const TABS = ['My Feed', 'Mental Health', 'Free Resources', 'Administration', 'Funny', 'Parents'];
const TOPICS = ['Mental Health', 'Class Management', 'Administration', 'Resources', 'Funny'];

const WEEKLY_PROMPT_KEY = 'weekly-prompt';
const WEEKLY_PROMPT: Post = {
  id: WEEKLY_PROMPT_KEY,
  text: 'What is something you started integrating into your classroom this year that made your job easier?',
  topic: 'Class Management',
  author: 'Teachers\' Lounge',
  author_id: '',
  anonymous: false,
  created_at: new Date('2026-03-01').toISOString(),
};

// Thread line starts below parent avatar:  paddingTop + full avatar
const THREAD_LINE_TOP = 12 + REPLY_AVATAR_SIZE;
// Avatar center within a nested card: paddingTop + half avatar
const NESTED_AVATAR_CENTER_OFFSET = 12 + REPLY_AVATAR_SIZE / 2;

function ReplyThreadGroup({
  reply, children, index, formatDate, openReplyBox, renderInlineReplyBox, styles, currentUserId, onDeleteReply,
}: {
  reply: Reply;
  children: Reply[];
  index: number;
  formatDate: (s: string) => string;
  openReplyBox: (type: 'post' | 'reply', id: string) => void;
  renderInlineReplyBox: (type: 'post' | 'reply', id: string) => React.ReactNode;
  styles: Record<string, any>;
  currentUserId: string;
  onDeleteReply: (id: string) => void;
}) {
  const groupRef = useRef<View>(null);
  const lastChildRef = useRef<View>(null);
  const [lineHeight, setLineHeight] = useState(0);

  const measure = useCallback(() => {
    if (!groupRef.current || !lastChildRef.current || children.length === 0) return;
    lastChildRef.current.measureLayout(
      groupRef.current as any,
      (_x: number, y: number) => {
        const avatarCenterY = y + NESTED_AVATAR_CENTER_OFFSET;
        setLineHeight(Math.max(0, avatarCenterY - THREAD_LINE_TOP));
      },
      () => {}
    );
  }, [children.length]);

  return (
    <View ref={groupRef} style={index > 0 ? styles.replyGroupSpacer : undefined}>
      {/* Thread line: absolutely positioned, precise height */}
      {children.length > 0 && lineHeight > 0 && (
        <View style={[styles.threadLineAbsolute, {
          top: THREAD_LINE_TOP,
          left: REPLY_LEFT_PAD + REPLY_AVATAR_SIZE / 2 - 1,
          height: lineHeight,
        }]} />
      )}
      <ReplyCard
        reply={reply}
        date={formatDate(reply.created_at)}
        onReply={() => openReplyBox('reply', reply.id)}
        showThreadLine={false}
        currentUserId={currentUserId}
        onDelete={() => onDeleteReply(reply.id)}
      />
      {renderInlineReplyBox('reply', reply.id)}
      {children.length > 0 && (
        <View style={{ marginLeft: REPLY_LEFT_PAD + REPLY_AVATAR_SIZE / 2 - 1 }}>
          {children.map((child, ci) => {
            const isLast = ci === children.length - 1;
            return (
              <View
                key={child.id}
                ref={isLast ? lastChildRef : undefined}
                onLayout={isLast ? measure : undefined}
              >
                <View style={styles.nestedReply}>
                  <View style={styles.branchConnector} />
                  <ReplyCard
                    reply={child}
                    date={formatDate(child.created_at)}
                    onReply={() => openReplyBox('reply', child.id)}
                    nested
                    currentUserId={currentUserId}
                    onDelete={() => onDeleteReply(child.id)}
                  />
                </View>
                {renderInlineReplyBox('reply', child.id)}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function ThreadsScreen() {
  const router = useRouter();
  const { openPrompt } = useLocalSearchParams<{ openPrompt?: string }>();
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
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [promptMenuVisible, setPromptMenuVisible] = useState(false);
  const [viewingPrompt, setViewingPrompt] = useState(false);
  const [promptSource, setPromptSource] = useState<'home' | 'threads'>('threads');
  const replyInputRef = useRef<TextInput>(null);
  const replyTextRef = useRef('');

  useEffect(() => {
    loadPosts();
    loadPromptReplies();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (openPrompt === 'true') {
      setViewingPrompt(true);
      setPromptSource('home');
    }
  }, [openPrompt]);

  const loadPromptReplies = async () => {
    const { data } = await fetchReplies(WEEKLY_PROMPT_KEY);
    if (data) setReplies(prev => ({ ...prev, [WEEKLY_PROMPT_KEY]: data }));
  };

  const handleDeletePost = async (postId: string) => {
    const { error } = await deletePost(postId);
    if (error) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (viewingPost?.id === postId) setViewingPost(null);
  };

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
    openPost(data);
  };

  const handleDeleteReply = async (replyId: string) => {
    const { error } = await supabase.from('replies').delete().eq('id', replyId);
    if (error) return;
    const postId = viewingPrompt ? WEEKLY_PROMPT_KEY : viewingPost?.id;
    if (!postId) return;
    setReplies(prev => ({
      ...prev,
      [postId]: (prev[postId] ?? []).filter(r => r.id !== replyId),
    }));
  };

  const handleReply = async () => {
    const text = replyTextRef.current.trim();
    if (!text || (!viewingPost && !viewingPrompt) || !replyingToId) return;
    setReplyError('');
    const [type, id] = replyingToId.split(':');
    const parentReplyId = type === 'reply' ? id : null;
    const postId = viewingPrompt ? WEEKLY_PROMPT_KEY : viewingPost!.id;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await createReply({
      post_id: postId,
      text,
      author: user?.user_metadata?.first_name ?? 'Teacher',
      author_id: user?.id ?? '',
      parent_reply_id: parentReplyId,
    });
    if (error || !data) {
      setReplyError(error?.message ?? 'Failed to post reply. Please try again.');
      return;
    }
    setReplies(prev => ({
      ...prev,
      [postId]: [...(prev[postId] ?? []), data],
    }));
    setReplyText('');
    replyTextRef.current = '';
    setReplyingToId(null);
    setReplyError('');
  };

  const openPost = async (post: Post) => {
    setViewingPost(post);
    const { data } = await fetchReplies(post.id);
    if (data) setReplies(prev => ({ ...prev, [post.id]: data }));
  };

  const openReplyBox = (type: 'post' | 'reply', id: string) => {
    setReplyingToId(`${type}:${id}`);
    setReplyText('');
    replyTextRef.current = '';
    setReplyError('');
    setTimeout(() => replyInputRef.current?.focus(), 100);
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
          <TouchableOpacity><Ionicons name="notifications-outline" size={24} color="#111" /></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/messages')}><Ionicons name="chatbubble-outline" size={24} color="#111" /></TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={TLColors.gray500} />
          <Text style={styles.searchText}>Search for posts...</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn}><Ionicons name="options-outline" size={22} color="#111" /></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => { setActiveTab(tab); setViewingPost(null); setViewingPrompt(false); }}>
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

  const renderInlineReplyBox = (type: 'post' | 'reply', id: string) =>
    replyingToId === `${type}:${id}` ? (
      <View style={styles.inlineReplyBox}>
        <TextInput
          ref={replyInputRef}
          style={styles.inlineReplyInput}
          placeholder="Write a reply..."
          placeholderTextColor={TLColors.gray500}
          value={replyText}
          onChangeText={v => { setReplyText(v); replyTextRef.current = v; }}
          multiline
          autoFocus
        />
        {replyError ? <Text style={styles.replyErrorText}>{replyError}</Text> : null}
        <View style={styles.inlineReplyActions}>
          <TouchableOpacity onPress={() => { setReplyingToId(null); setReplyText(''); replyTextRef.current = ''; setReplyError(''); }} >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendBtn, !replyText.trim() && { opacity: 0.4 }]}
            onPressIn={handleReply}>
            <Text style={styles.sendBtnText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    ) : null;

  // Post detail view
  if (viewingPrompt) {
    const promptReplies = replies[WEEKLY_PROMPT_KEY] ?? [];
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ScrollView style={styles.feed}>
          <TouchableOpacity style={styles.backBtn} onPress={() => {
            setReplyText(''); setReplyingToId(null);
            setViewingPrompt(false);
            if (promptSource === 'home') router.back();
          }}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>Weekly Community Prompt</Text>
            <View style={styles.promptMeta}>
              <View style={styles.promptTag}><Text style={styles.promptTagText}>Class Management</Text></View>
              <Text style={styles.promptDate}>Week of 3/1/26 – 3/9/26</Text>
            </View>
            <Text style={styles.promptQuestion}>{WEEKLY_PROMPT.text}</Text>
            <View style={styles.postActions}>
              <TouchableOpacity onPress={() => setPromptMenuVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="ellipsis-horizontal" size={18} color="#888" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}><Ionicons name="bookmark-outline" size={16} color="#888" /><Text style={styles.actionLabel}>Save</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}><Ionicons name="heart-outline" size={16} color="#888" /><Text style={styles.actionLabel}>Like</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openReplyBox('post', WEEKLY_PROMPT_KEY)}>
                <Ionicons name="arrow-undo-outline" size={16} color="#888" /><Text style={styles.actionLabel}>Reply</Text>
              </TouchableOpacity>
            </View>
            <OptionsSheet visible={promptMenuVisible} onClose={() => setPromptMenuVisible(false)} options={[{ label: 'Share', icon: 'share-outline' as const, onPress: () => {} }]} />
          </View>
          {renderInlineReplyBox('post', WEEKLY_PROMPT_KEY)}
          <View style={styles.divider} />
          {promptReplies.filter(r => !r.parent_reply_id).map((reply, index) => {
            const children = promptReplies.filter(r => String(r.parent_reply_id) === String(reply.id));
            return (
              <ReplyThreadGroup
                key={reply.id}
                reply={reply}
                children={children}
                index={index}
                formatDate={formatDate}
                openReplyBox={openReplyBox}
                renderInlineReplyBox={renderInlineReplyBox}
                styles={styles}
                currentUserId={currentUserId}
                onDeleteReply={handleDeleteReply}
              />
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
        <TouchableOpacity style={styles.fab} onPress={() => setCreateVisible(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
        {createPostModal}
      </SafeAreaView>
    );
  }

  if (viewingPost) {
    const postReplies = replies[viewingPost.id] ?? [];
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ScrollView style={styles.feed}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { setViewingPost(null); setReplyText(''); setReplyingToId(null); }}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
          <PostCard post={viewingPost} date={formatDate(viewingPost.created_at)} onReply={() => openReplyBox('post', viewingPost.id)} currentUserId={currentUserId} onDelete={() => handleDeletePost(viewingPost.id)} />
          {renderInlineReplyBox('post', viewingPost.id)}
          <View style={styles.divider} />
          {postReplies.filter(r => !r.parent_reply_id).map((reply, index) => {
            const children = postReplies.filter(r => String(r.parent_reply_id) === String(reply.id));
            return (
              <ReplyThreadGroup
                key={reply.id}
                reply={reply}
                children={children}
                index={index}
                formatDate={formatDate}
                openReplyBox={openReplyBox}
                renderInlineReplyBox={renderInlineReplyBox}
                styles={styles}
                currentUserId={currentUserId}
                onDeleteReply={handleDeleteReply}
              />
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
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
          <TouchableOpacity onPress={() => { setPromptSource('threads'); setViewingPrompt(true); }} activeOpacity={0.85}>
            <Text style={styles.promptTitle}>Weekly Community Prompt</Text>
            <View style={styles.promptMeta}>
              <View style={styles.promptTag}><Text style={styles.promptTagText}>Class Management</Text></View>
              <Text style={styles.promptDate}>Week of 3/1/26 – 3/9/26</Text>
            </View>
            <Text style={styles.promptQuestion}>
              What is something you started integrating into your classroom this year that made your job easier?
            </Text>
          </TouchableOpacity>
          <View style={styles.postActions}>
            <TouchableOpacity onPress={() => setPromptMenuVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="ellipsis-horizontal" size={18} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}><Ionicons name="heart-outline" size={16} color="#888" /><Text style={styles.actionLabel}>Like</Text></TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => { setPromptSource('threads'); setViewingPrompt(true); }}>
              <Ionicons name="arrow-undo-outline" size={16} color="#888" /><Text style={styles.actionLabel}>Reply</Text>
            </TouchableOpacity>
          </View>
          <OptionsSheet visible={promptMenuVisible} onClose={() => setPromptMenuVisible(false)} options={[{ label: 'Share', icon: 'share-outline' as const, onPress: () => {} }]} />
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
              <PostCard post={post} date={formatDate(post.created_at)} onPress={() => openPost(post)} currentUserId={currentUserId} onDelete={() => handleDeletePost(post.id)} />
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
  backBtn: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  backText: { fontSize: 16, color: TLColors.black, fontWeight: '500' },
  promptCard: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 },
  promptTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 10 },
  promptMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  promptTag: { borderWidth: 1.5, borderColor: '#333', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3 },
  promptTagText: { fontSize: 12, color: '#333' },
  promptDate: { fontSize: 12, color: '#888' },
  promptQuestion: { fontSize: 14, color: '#222', lineHeight: 20, marginBottom: 12 },
  promptReplyPreview: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  promptReplyAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: TLColors.gray300, alignItems: 'center', justifyContent: 'center' },
  promptReplyAvatarText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  promptReplyBody: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  promptReplyAuthor: { fontSize: 12, fontWeight: '600', color: '#111', marginBottom: 2 },
  promptReplyText: { fontSize: 12, color: '#444', lineHeight: 16 },
  promptNoReplies: { fontSize: 13, color: TLColors.gray500, fontStyle: 'italic', marginBottom: 12 },
  postActions: { flexDirection: 'row', gap: 16, alignItems: 'center', justifyContent: 'flex-end' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionIcon: {},
  actionLabel: { fontSize: 13, color: '#888' },
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
  replyGroupSpacer: { borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  threadLineAbsolute: {
    position: 'absolute',
    width: 2,
    backgroundColor: '#ddd',
    borderRadius: 1,
  },
  nestedReply: { flexDirection: 'row', alignItems: 'flex-start' },
  branchConnector: {
    width: 18,
    height: 20,
    borderBottomWidth: 2,
    borderColor: '#ddd',
    borderBottomLeftRadius: 10,
    marginTop: 8,
    flexShrink: 0,
  },
  nestedContent: { flex: 1 },
  inlineReplyBox: {
    marginHorizontal: 20, marginBottom: 12,
    borderWidth: 1, borderColor: TLColors.gray300, borderRadius: 10,
    padding: 12, backgroundColor: '#fafafa',
  },
  inlineReplyInput: {
    fontSize: 14, color: '#222', minHeight: 60, textAlignVertical: 'top',
    textAlign: 'left', writingDirection: 'ltr',
  },
  inlineReplyActions: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8, alignItems: 'center',
  },
  replyErrorText: { fontSize: 12, color: TLColors.danger, marginTop: 4 },
  cancelText: { fontSize: 14, color: TLColors.gray500 },
  sendBtn: {
    backgroundColor: TLColors.primary, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7,
  },
  sendBtnText: { color: TLColors.white, fontSize: 14, fontWeight: '600' },
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
    marginBottom: 16, textAlign: 'left', writingDirection: 'ltr',
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
