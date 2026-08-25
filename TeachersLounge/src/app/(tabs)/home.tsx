import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { TLColors } from '@/constants/theme';
import { fetchReplies } from '@/services/replies';
import { fetchPosts } from '@/services/posts';
import { getLikeCounts } from '@/services/likes';

const WEEKLY_PROMPT_KEY = 'weekly-prompt';

const AVATAR_COLORS = ['#2c7873', '#8e44ad', '#c0392b', '#3d7ebf', '#b05e8a', '#e67e22', '#27ae60'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function HomeScreen() {
  const router = useRouter();
  const [promptReplies, setPromptReplies] = useState<{ id: string; author: string; text: string }[]>([]);
  const [recentPosts, setRecentPosts] = useState<{ id: string; author: string; author_id: string; text: string; topic: string; created_at: string }[]>([]);

  useEffect(() => {
    fetchReplies(WEEKLY_PROMPT_KEY).then(async ({ data }) => {
      if (!data) return;
      const topLevel = data.filter((r: any) => !r.parent_reply_id);
      const ids = topLevel.map((r: any) => String(r.id));
      const counts = await getLikeCounts(ids, 'reply');
      const sorted = [...topLevel].sort((a, b) => (counts[String(b.id)] ?? 0) - (counts[String(a.id)] ?? 0));
      setPromptReplies(sorted.slice(0, 3));
    });

    fetchPosts().then(({ data }) => {
      if (!data) return;
      setRecentPosts(data.slice(0, 10));
    });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <Image source={require('@/assets/images/tl-logo.png')} style={styles.headerLogoImg} />
          <Text style={styles.headerTitle}>{"Teachers'\nLounge"}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => router.push('/lounge-requests')}><Ionicons name="notifications-outline" size={24} color="#111" /></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/messages')}><Ionicons name="chatbubble-outline" size={24} color="#111" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#999" />
          <Text style={styles.searchText}>Search across Teachers' Lounge</Text>
        </View>

        {/* Active Members */}
        <View style={styles.section}>
          <Text style={styles.noActive}>No Active Lounge Members right now</Text>
        </View>

        <View style={styles.divider} />

        {/* Weekly Community Prompt */}
        <TouchableOpacity style={styles.section} onPress={() => router.push('/(tabs)/threads?openPrompt=true')} activeOpacity={0.8}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Community Prompt</Text>
            <Text style={styles.arrow}>›</Text>
          </View>
          <View style={styles.promptMeta}>
            <View style={styles.promptTag}><Text style={styles.promptTagText}>Class Management</Text></View>
            <Text style={styles.promptDate}>Week of 3/1/26 – 3/9/26</Text>
          </View>
          <Text style={styles.promptQuestion}>
            What is something you started integrating into your classroom this year that made your job easier?
          </Text>
          {promptReplies.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptPreviewsScroll} contentContainerStyle={styles.promptPreviewsContent}>
              {promptReplies.map(r => (
                <View key={r.id} style={styles.promptPreviewCard}>
                  <View style={styles.promptPreviewHeader}>
                    <View style={[styles.promptPreviewAvatar, { backgroundColor: getAvatarColor(r.author) }]}>
                      <Text style={styles.promptPreviewAvatarText}>{r.author[0]}</Text>
                    </View>
                    <Text style={styles.promptPreviewAuthor}>{r.author}</Text>
                  </View>
                  <Text style={styles.promptPreviewText} numberOfLines={3}>{r.text}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noComments}>
              <Text style={styles.noCommentsText}>No responses yet — be the first to reply!</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity in Your Lounge</Text>
          </View>
          {recentPosts.length === 0 ? (
            <View style={styles.noComments}>
              <Text style={styles.noCommentsText}>No posts yet — be the first to post!</Text>
            </View>
          ) : (
            recentPosts.map(post => (
              <TouchableOpacity key={post.id} style={styles.activityCard} onPress={() => router.push('/(tabs)/threads')}>
                <View style={styles.activityHeader}>
                  <View style={[styles.activityAvatar, { backgroundColor: getAvatarColor(post.author) }]}>
                    <Text style={styles.activityAvatarText}>{post.author[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.activityMeta}>
                    <Text style={styles.activityAuthor}>{post.author}</Text>
                    <View style={styles.activityTopicRow}>
                      <Text style={styles.activityTopic}>{post.topic}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.activityText} numberOfLines={3}>{post.text}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
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
  headerLogoImg: { width: 44, height: 44, resizeMode: 'contain' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: TLColors.primary, lineHeight: 18 },
  headerIcons: { flexDirection: 'row', gap: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f5f5f5', borderRadius: 10,
    marginHorizontal: 20, marginVertical: 12, padding: 10,
  },
  searchText: { fontSize: 14, color: '#999' },
  section: { paddingHorizontal: 20, marginBottom: 12 },
  noActive: { fontSize: 13, color: '#aaa', fontStyle: 'italic', paddingVertical: 8 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  arrow: { fontSize: 22, color: '#666' },

  promptMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  promptTag: { borderWidth: 1.5, borderColor: '#333', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3 },
  promptTagText: { fontSize: 12, color: '#333' },
  promptDate: { fontSize: 12, color: '#888' },
  promptQuestion: { fontSize: 14, color: '#222', lineHeight: 20, marginBottom: 12 },
  noComments: {
    borderWidth: 1.5, borderColor: '#e0e0e0', borderStyle: 'dashed',
    borderRadius: 10, padding: 16, alignItems: 'center',
  },
  noCommentsText: { fontSize: 13, color: '#aaa', fontStyle: 'italic' },
  promptPreviewsScroll: { marginTop: 10 },
  promptPreviewsContent: { gap: 10, paddingRight: 4 },
  promptPreviewCard: {
    width: 160, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    padding: 12, backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  promptPreviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  promptPreviewAvatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  promptPreviewAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  promptPreviewAuthor: { fontSize: 13, fontWeight: '600', color: '#111', flex: 1 },
  promptPreviewText: { fontSize: 12, color: '#555', lineHeight: 17 },

  activityCard: {
    borderWidth: 1, borderColor: '#ebebeb', borderRadius: 14,
    padding: 14, marginBottom: 12, backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  activityHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  activityAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  activityAvatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  activityMeta: { flex: 1 },
  activityAuthor: { fontSize: 14, fontWeight: '700', color: '#111' },
  activityTopicRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  activityTopic: { fontSize: 12, color: TLColors.primary, fontWeight: '500' },
  activityText: { fontSize: 14, color: '#444', lineHeight: 20 },
});
