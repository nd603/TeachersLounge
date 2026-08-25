import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TLColors } from '@/constants/theme';
import NotificationBell from '@/components/NotificationBell';

export default function MessagesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <NotificationBell />
          <TouchableOpacity><Ionicons name="chatbubble-outline" size={24} color="#111" /></TouchableOpacity>
        </View>
      </View>

      {/* Search row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={TLColors.gray500} />
          <TextInput style={styles.searchInput} placeholder="Search" placeholderTextColor={TLColors.gray500} />
        </View>
        <TouchableOpacity style={styles.composeBtn}>
          <Ionicons name="create-outline" size={24} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* New Connections */}
        <Text style={styles.sectionTitle}>New Connections</Text>
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>No new connections yet</Text>
        </View>

        {/* My Chats */}
        <Text style={styles.sectionTitle}>My Chats</Text>
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>No chats yet — start a conversation!</Text>
        </View>

        {/* Communities */}
        <Text style={styles.sectionTitle}>Communities</Text>
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>No communities yet</Text>
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
    paddingHorizontal: 20, paddingVertical: 12,
  },
  headerRight: { flexDirection: 'row', gap: 16 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111' },
  composeBtn: { padding: 6 },
  scroll: { flex: 1 },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: '#111',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10,
  },
  emptySection: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f0f0f0',
  },
  emptyText: { fontSize: 14, color: TLColors.gray500, fontStyle: 'italic' },
});
