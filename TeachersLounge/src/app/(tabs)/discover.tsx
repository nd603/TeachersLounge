import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TLColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const AVATAR_COLORS = ['#2c7873', '#8e44ad', '#c0392b', '#3d7ebf', '#b05e8a', '#e67e22', '#27ae60'];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const GRADE_FILTERS = ['K - 5th', '6th - 8th', '9th - 12th'];

const LESSON_PLANS = [
  { id: '1', title: 'Paragraph of the Week – Writing Para…', price: '$3.99', creator: "Mrs. E's Class", initials: 'ME', color: '#e67e22', bg: '#fff8e1' },
  { id: '2', title: 'STEAM Activities – Morning Work Tubs', price: '$2.99', creator: "Mrs. C's Creations", initials: 'MC', color: '#27ae60', bg: '#e8f5e9' },
  { id: '3', title: 'Prefixes & Suffixes Worksheets', price: '$4.50', creator: 'Eloise D.', initials: 'ED', color: '#8e44ad', bg: '#f3e5f5' },
];

const DISCUSSIONS = [
  { id: '1', tag: 'Mental Health', text: "I've been dealing with burnout and I'm not sure how to mana…" },
  { id: '2', tag: 'Administration', text: 'How do you handle administration trying…' },
];

const PODCASTS = [
  { id: '1', title: 'Six Ed Tech Tools to Use in 2026', show: 'The Cult of Pedagogy', duration: '1 hr 7 min', tag: 'Technology', bg: '#2c3e50' },
  { id: '2', title: 'Building Classroom Community Early', show: 'Teach Me, Teacher', duration: '42 min', tag: 'Class Management', bg: '#16a085' },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, username')
        .neq('id', user?.id ?? '')
        .limit(6);
      setTeachers(data ?? []);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity><Ionicons name="notifications-outline" size={24} color="#111" /></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/messages')}><Ionicons name="chatbubble-outline" size={24} color="#111" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchText}>Search for posts, lesson plans, activities, pod...</Text>
          <Ionicons name="search-outline" size={20} color="#aaa" />
        </View>

        {/* Grow Your Lounge */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Grow Your Lounge</Text>
              <Text style={styles.sectionSubtitle}>Find other like-minded teachers based on your interests{'\n'}and engagement.</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#666" />
          </TouchableOpacity>
          <View style={styles.teacherGrid}>
            {teachers.length === 0 ? (
              <Text style={{ color: '#aaa', fontStyle: 'italic', fontSize: 13 }}>No other teachers yet</Text>
            ) : teachers.map(t => {
              const name = [t.first_name, t.last_name].filter(Boolean).join(' ') || t.username || 'Teacher';
              const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
              return (
                <View key={t.id} style={styles.teacherCard}>
                  <View style={[styles.teacherAvatar, { backgroundColor: avatarColor(t.id) }]}>
                    <Text style={styles.teacherInitials}>{initials}</Text>
                  </View>
                  <Text style={styles.teacherName}>{name}</Text>
                  {t.username ? <Text style={styles.teacherInfo}>@{t.username}</Text> : null}
                  <TouchableOpacity style={styles.viewProfileBtn} onPress={() => router.push(`/user/${t.id}`)}>
                    <Text style={styles.viewProfileText}>View Profile</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Featured Lesson Plans */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Teachers Pay{'\n'}Teachers Lesson Plans</Text>
            <Ionicons name="chevron-forward" size={22} color="#666" />
          </TouchableOpacity>
          <GradeFilter />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollContent}>
            {LESSON_PLANS.map(p => (
              <TouchableOpacity key={p.id} style={styles.lessonCard}>
                <View style={[styles.lessonImg, { backgroundColor: p.bg }]}>
                  <Ionicons name="book-outline" size={40} color="rgba(0,0,0,0.15)" />
                  <TouchableOpacity style={styles.bookmarkBtn}>
                    <Ionicons name="bookmark-outline" size={16} color="#555" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.lessonPrice}>{p.price}</Text>
                <Text style={styles.lessonTitle} numberOfLines={2}>{p.title}</Text>
                <View style={styles.creatorRow}>
                  <View style={[styles.creatorAvatar, { backgroundColor: p.color }]}>
                    <Text style={styles.creatorInitials}>{p.initials}</Text>
                  </View>
                  <Text style={styles.creatorName}>{p.creator}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        {/* Trending Discussions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Discussions</Text>
          <View style={styles.discussionRow}>
            {DISCUSSIONS.map(d => (
              <TouchableOpacity key={d.id} style={styles.discussionCard}>
                <Text style={styles.discussionTag}>• {d.tag}</Text>
                <Text style={styles.discussionText} numberOfLines={3}>{d.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Highlighted Podcasts */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Highlighted Podcast Episodes</Text>
            <Ionicons name="chevron-forward" size={22} color="#666" />
          </TouchableOpacity>
          {PODCASTS.map(p => (
            <TouchableOpacity key={p.id} style={styles.podcastCard}>
              <View style={[styles.podcastImg, { backgroundColor: p.bg }]}>
                <Ionicons name="mic-outline" size={28} color="rgba(255,255,255,0.6)" />
              </View>
              <View style={styles.podcastInfo}>
                <Text style={styles.podcastTitle} numberOfLines={2}>{p.title}</Text>
                <Text style={styles.podcastShow}>{p.show}</Text>
                <Text style={styles.podcastDuration}>{p.duration}</Text>
                <View style={styles.podcastTag}>
                  <Text style={styles.podcastTagText}>{p.tag}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.podcastBookmark}>
                <Ionicons name="bookmark-outline" size={18} color="#555" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function GradeFilter() {
  const [active, setActive] = React.useState('K - 5th');
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gradeFilters}>
      {GRADE_FILTERS.map(g => (
        <TouchableOpacity
          key={g}
          style={[styles.gradeChip, active === g && styles.gradeChipActive]}
          onPress={() => setActive(g)}>
          <Text style={[styles.gradeChipText, active === g && styles.gradeChipTextActive]}>{g}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

import React from 'react';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#111' },
  headerIcons: { flexDirection: 'row', gap: 16 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 20,
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fafafa',
  },
  searchText: { fontSize: 14, color: '#aaa', flex: 1 },

  section: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111', lineHeight: 24 },
  sectionSubtitle: { fontSize: 13, color: '#777', marginTop: 4, lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#f0f0f0' },

  // Teachers grid
  teacherGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  teacherCard: {
    width: '47%', borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 14,
    padding: 14, alignItems: 'center',
  },
  teacherAvatar: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  teacherInitials: { fontSize: 22, fontWeight: '700', color: '#fff' },
  teacherName: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 4, textAlign: 'center' },
  teacherInfo: { fontSize: 12, color: '#555', textAlign: 'center', lineHeight: 18, marginBottom: 4 },
  teacherExp: { fontSize: 11, color: '#888', marginBottom: 12 },
  viewProfileBtn: {
    backgroundColor: TLColors.primary, borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 16, width: '100%', alignItems: 'center',
  },
  viewProfileText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Grade filter
  gradeFilters: { gap: 8, paddingBottom: 14 },
  gradeChip: {
    borderWidth: 1.5, borderColor: '#ccc', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7,
  },
  gradeChipActive: { backgroundColor: TLColors.primary, borderColor: TLColors.primary },
  gradeChipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  gradeChipTextActive: { color: '#fff' },

  // Lesson plans
  hScrollContent: { gap: 12, paddingRight: 4 },
  lessonCard: { width: 160 },
  lessonImg: {
    width: 160, height: 120, borderRadius: 12, marginBottom: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  bookmarkBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 6,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  lessonPrice: { fontSize: 12, fontWeight: '600', color: '#111', marginBottom: 4 },
  lessonTitle: { fontSize: 13, fontWeight: '600', color: '#111', lineHeight: 18, marginBottom: 8 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  creatorAvatar: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  creatorInitials: { fontSize: 9, fontWeight: '700', color: '#fff' },
  creatorName: { fontSize: 11, color: '#666', flex: 1 },

  // Discussions
  discussionRow: { flexDirection: 'row', gap: 12 },
  discussionCard: {
    flex: 1, borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12, padding: 14,
  },
  discussionTag: { fontSize: 13, fontWeight: '600', color: '#111', marginBottom: 8 },
  discussionText: { fontSize: 13, color: '#555', lineHeight: 18 },

  // Podcasts
  podcastCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 14, padding: 12,
  },
  podcastImg: {
    width: 80, height: 80, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  podcastInfo: { flex: 1 },
  podcastTitle: { fontSize: 14, fontWeight: '700', color: '#111', lineHeight: 20, marginBottom: 4 },
  podcastShow: { fontSize: 12, color: '#666', marginBottom: 2 },
  podcastDuration: { fontSize: 12, color: '#999', marginBottom: 8 },
  podcastTag: {
    alignSelf: 'flex-start', backgroundColor: TLColors.primary,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  podcastTagText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  podcastBookmark: { paddingTop: 2 },
});
