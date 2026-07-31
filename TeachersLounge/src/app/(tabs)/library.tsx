import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TLColors } from '@/constants/theme';
import { useSavedResources } from '@/context/SavedResourcesContext';

type Tab = 'Saved' | 'Boards';
type Filter = 'All Resources' | 'Lesson Plans' | 'Activities';

const BOARDS = [
  { id: '1', name: 'Math Manipulatives', count: 12, bg: '#d0eaff' },
  { id: '2', name: 'Reading Comprehension', count: 20, bg: '#ffecd0' },
  { id: '3', name: 'Phonics', count: 6, bg: '#ffd0d0' },
  { id: '4', name: 'Science Experiments', count: 8, bg: '#1a1a2e' },
];

const FILTERS: Filter[] = ['All Resources', 'Lesson Plans', 'Activities'];

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('Saved');
  const [activeFilter, setActiveFilter] = useState<Filter>('All Resources');
  const [search, setSearch] = useState('');
  const { savedResources, toggleSave, isSaved } = useSavedResources();

  const filteredResources = savedResources.filter(r => {
    const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity><Ionicons name="notifications-outline" size={24} color="#111" /></TouchableOpacity>
          <TouchableOpacity><Ionicons name="chatbubble-outline" size={24} color="#111" /></TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for posts, lesson plans, activities, pod..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
        <Ionicons name="search-outline" size={20} color="#aaa" style={styles.searchIcon} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['Saved', 'Boards'] as Tab[]).map(tab => (
          <TouchableOpacity key={tab} style={styles.tab} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.tabDivider} />

      {activeTab === 'Saved' ? (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, activeFilter === f && styles.chipActive]}
                onPress={() => setActiveFilter(f)}>
                <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sort by */}
          {filteredResources.length > 0 && (
            <View style={styles.sortRow}>
              <TouchableOpacity style={styles.sortBtn}>
                <Text style={styles.sortText}>Sort By</Text>
                <Ionicons name="chevron-down" size={16} color="#111" />
              </TouchableOpacity>
            </View>
          )}

          {/* Resource cards */}
          {filteredResources.map(r => (
            <TouchableOpacity key={r.id} style={styles.resourceCard}>
              <View style={[styles.resourceImg, { backgroundColor: r.bg }]}>
                <Ionicons name={r.icon as any} size={48} color="rgba(0,0,0,0.2)" />
                <TouchableOpacity style={styles.bookmarkBtn} onPress={() => toggleSave(r)}>
                  <Ionicons name={isSaved(r.id) ? 'bookmark' : 'bookmark-outline'} size={18} color={isSaved(r.id) ? TLColors.primary : '#111'} />
                </TouchableOpacity>
              </View>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourcePrice}>{r.price}</Text>
                <Text style={styles.resourceTitle} numberOfLines={2}>{r.title}</Text>
                <View style={styles.resourceMeta}>
                  <View style={styles.creatorAvatar}>
                    <Text style={styles.creatorAvatarText}>{r.creator[0]}</Text>
                  </View>
                  <Text style={styles.creatorName}>{r.creator}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {filteredResources.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="bookmark-outline" size={48} color={TLColors.gray300} />
              <Text style={styles.emptyTitle}>Nothing saved yet</Text>
              <Text style={styles.emptyText}>Tap the bookmark icon on any resource to save it here</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.boardsContainer}>
          {/* Create Board */}
          <TouchableOpacity style={styles.createBoard}>
            <View style={styles.createBoardIcon}>
              <Ionicons name="add" size={28} color="#fff" />
            </View>
            <Text style={styles.createBoardText}>Create Board</Text>
          </TouchableOpacity>

          {/* Board grid */}
          <View style={styles.boardGrid}>
            {BOARDS.map(b => (
              <TouchableOpacity key={b.id} style={styles.boardCard}>
                <View style={[styles.boardImg, { backgroundColor: b.bg }]}>
                  <View style={styles.boardIconBadge}>
                    <Ionicons name="library-outline" size={18} color="#fff" />
                  </View>
                  <View style={styles.boardCountBadge}>
                    <Text style={styles.boardCountText}>{b.count} items</Text>
                  </View>
                </View>
                <Text style={styles.boardName}>{b.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

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
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#111' },
  headerIcons: { flexDirection: 'row', gap: 16 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fafafa',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111' },
  searchIcon: { marginLeft: 8 },

  tabs: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 10 },
  tabText: { fontSize: 15, fontWeight: '500', color: TLColors.gray500 },
  tabTextActive: { color: '#111', fontWeight: '700' },
  tabUnderline: { position: 'absolute', bottom: 0, left: 16, right: 16, height: 2, backgroundColor: '#111', borderRadius: 1 },
  tabDivider: { height: 1, backgroundColor: '#e8e8e8', marginBottom: 4 },

  scroll: { flex: 1 },

  filtersRow: { paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  chip: {
    borderWidth: 1.5, borderColor: TLColors.primary, borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  chipActive: { backgroundColor: TLColors.primary },
  chipText: { fontSize: 14, color: TLColors.primary, fontWeight: '500' },
  chipTextActive: { color: '#fff' },

  sortRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, marginBottom: 10 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText: { fontSize: 14, fontWeight: '600', color: '#111' },

  resourceCard: {
    marginHorizontal: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12, overflow: 'hidden',
  },
  resourceImg: { height: 180, alignItems: 'center', justifyContent: 'center' },
  bookmarkBtn: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: '#fff', borderRadius: 8,
    width: 34, height: 34, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  resourceInfo: { padding: 14 },
  resourcePrice: { fontSize: 13, fontWeight: '600', color: '#111', textAlign: 'right', marginBottom: 4 },
  resourceTitle: { fontSize: 15, fontWeight: '700', color: '#111', lineHeight: 22, marginBottom: 10 },
  resourceMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  creatorAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: TLColors.primary, alignItems: 'center', justifyContent: 'center',
  },
  creatorAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  creatorName: { fontSize: 13, color: '#555', flex: 1 },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  emptyText: { fontSize: 14, color: TLColors.gray500, textAlign: 'center', lineHeight: 20 },

  boardsContainer: { paddingHorizontal: 20, paddingTop: 16 },
  createBoard: {
    borderWidth: 1.5, borderColor: '#ccc', borderStyle: 'dashed', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 24, marginBottom: 24, gap: 10,
  },
  createBoardIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: TLColors.primary, alignItems: 'center', justifyContent: 'center',
  },
  createBoardText: { fontSize: 15, fontWeight: '600', color: '#111' },

  boardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  boardCard: { width: '47%' },
  boardImg: {
    width: '100%', aspectRatio: 1, borderRadius: 12,
    marginBottom: 8, alignItems: 'flex-start', justifyContent: 'flex-start', padding: 10,
  },
  boardIconBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: 6,
  },
  boardCountBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    paddingVertical: 6, alignItems: 'center',
  },
  boardCountText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  boardName: { fontSize: 14, fontWeight: '600', color: '#111' },
});
