import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { TLColors } from '@/constants/theme';
import { useSavedResources, type Resource } from '@/context/SavedResourcesContext';
import { fetchReplies } from '@/services/replies';
import { getLikeCounts } from '@/services/likes';

const WEEKLY_PROMPT_KEY = 'weekly-prompt';

const RESOURCES: Resource[] = [
  { id: '1', title: 'Daily Reading Bell Ringers', price: 'FREE', creator: 'One Stop Teacher', icon: 'clipboard-outline', bg: '#dff0ee' },
  { id: '2', title: 'Prefixes & Suffixes Worksheets Greek…', price: '$9.00', creator: 'Eloise_D', icon: 'book-outline', bg: '#f0eaff' },
  { id: '3', title: 'Math Morning Work — Grade 7', price: '$4.50', creator: 'A. Miller', icon: 'pencil-outline', bg: '#fff3e0' },
];

const TEACHERS = [
  { id: '1', name: 'Jess Williams', subject: 'Social Studies', grade: '8th Grade', exp: '5+ yrs', initials: 'JW', color: '#2c7873' },
  { id: '2', name: 'Danessa M.', subject: 'Language Arts', grade: '6th Grade', exp: '5+ yrs', initials: 'DM', color: '#8e44ad' },
  { id: '3', name: 'Luis R.', subject: 'Science', grade: '7th Grade', exp: '3+ yrs', initials: 'LR', color: '#c0392b' },
];

export default function HomeScreen() {
  const { toggleSave, isSaved } = useSavedResources();
  const router = useRouter();
  const [promptReplies, setPromptReplies] = useState<{ id: string; author: string; text: string }[]>([]);

  useEffect(() => {
    fetchReplies(WEEKLY_PROMPT_KEY).then(async ({ data }) => {
      if (!data) return;
      const topLevel = data.filter((r: any) => !r.parent_reply_id);
      const ids = topLevel.map((r: any) => String(r.id));
      const counts = await getLikeCounts(ids, 'reply');
      const sorted = [...topLevel].sort((a, b) => (counts[String(b.id)] ?? 0) - (counts[String(a.id)] ?? 0));
      setPromptReplies(sorted.slice(0, 3));
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
          <TouchableOpacity><Ionicons name="notifications-outline" size={24} color="#111" /></TouchableOpacity>
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
              {promptReplies.slice(0, 3).map(r => (
                <View key={r.id} style={styles.promptPreviewCard}>
                  <View style={styles.promptPreviewHeader}>
                    <View style={styles.promptPreviewAvatar}>
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

        {/* Top Resources */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>This Week's Top Resources</Text>
            <Text style={styles.arrow}>›</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.hScrollContent}>
          {RESOURCES.map(r => {
            const saved = isSaved(r.id);
            return (
              <TouchableOpacity key={r.id} style={styles.resourceCard}>
                <View style={[styles.resourceImg, { backgroundColor: r.bg }]}>
                  <Ionicons name={r.icon as any} size={36} color="#555" />
                  <TouchableOpacity
                    style={styles.bookmark}
                    onPress={() => toggleSave(r)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons
                      name={saved ? 'bookmark' : 'bookmark-outline'}
                      size={16}
                      color={saved ? TLColors.primary : '#555'}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.resourcePrice}>{r.price}</Text>
                <Text style={styles.resourceTitle} numberOfLines={2}>{r.title}</Text>
                <Text style={styles.resourceCreator}>{r.creator}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.divider} />

        {/* Find Teachers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Find Teachers to Connect With</Text>
            <Text style={styles.arrow}>›</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.hScrollContent}>
          {TEACHERS.map(t => (
            <View key={t.id} style={styles.teacherCard}>
              <View style={[styles.teacherAvatar, { backgroundColor: t.color }]}>
                <Text style={styles.teacherInitials}>{t.initials}</Text>
              </View>
              <Text style={styles.teacherName}>{t.name}</Text>
              <Text style={styles.teacherSub}>{t.subject}, {t.grade}</Text>
              <Text style={styles.teacherExp}>{t.exp} experience</Text>
              <TouchableOpacity style={styles.btnProfile}>
                <Text style={styles.btnProfileText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

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
    backgroundColor: TLColors.primary, alignItems: 'center', justifyContent: 'center',
  },
  promptPreviewAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  promptPreviewAuthor: { fontSize: 13, fontWeight: '600', color: '#111', flex: 1 },
  promptPreviewText: { fontSize: 12, color: '#555', lineHeight: 17 },
  hScroll: { marginBottom: 16 },
  hScrollContent: { paddingHorizontal: 20, gap: 12 },
  resourceCard: { width: 150 },
  resourceImg: {
    width: 150, height: 110, borderRadius: 10,
    marginBottom: 6, alignItems: 'center', justifyContent: 'center',
  },
  bookmark: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 6,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  resourcePrice: { fontSize: 11, color: '#888', marginBottom: 2 },
  resourceTitle: { fontSize: 13, fontWeight: '600', color: '#111', marginBottom: 4, lineHeight: 18 },
  resourceCreator: { fontSize: 11, color: '#666' },
  teacherCard: {
    width: 150, borderWidth: 1.5, borderColor: '#e8e8e8',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  teacherAvatar: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  teacherInitials: { fontSize: 20, fontWeight: '700', color: TLColors.white },
  teacherName: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 3 },
  teacherSub: { fontSize: 12, color: '#555', marginBottom: 2, textAlign: 'center' },
  teacherExp: { fontSize: 11, color: '#888', marginBottom: 10 },
  btnProfile: {
    backgroundColor: TLColors.primary, borderRadius: 8,
    paddingVertical: 7, paddingHorizontal: 14, width: '100%', alignItems: 'center',
  },
  btnProfileText: { color: TLColors.white, fontSize: 12, fontWeight: '600' },
});
