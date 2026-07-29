import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TLColors } from '@/constants/theme';

export type Reply = {
  id: string;
  post_id: string;
  text: string;
  author: string;
  author_id: string;
  created_at: string;
};

export function ReplyCard({ reply, date, onReply }: { reply: Reply; date: string; onReply?: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{reply.author[0]}</Text></View>
        <Text style={styles.author}>{reply.author}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <Text style={styles.text}>{reply.text}</Text>
      <View style={styles.actions}>
        <TouchableOpacity><Text style={styles.actionLabel}>···</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.actionIcon}>🔖</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.actionIcon}>♡</Text></TouchableOpacity>
        <TouchableOpacity onPress={onReply}><Text style={styles.actionIcon}>↪</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: TLColors.gray300, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: TLColors.white, fontWeight: '700', fontSize: 13 },
  author: { fontSize: 14, fontWeight: '600', color: '#111', flex: 1 },
  date: { fontSize: 12, color: '#888' },
  text: { fontSize: 14, color: '#222', lineHeight: 20, marginBottom: 10, marginLeft: 40 },
  actions: { flexDirection: 'row', gap: 16, alignItems: 'center', marginLeft: 40 },
  actionLabel: { fontSize: 13, color: '#888' },
  actionIcon: { fontSize: 16, color: '#888' },
});
