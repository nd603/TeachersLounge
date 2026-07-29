import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TLColors } from '@/constants/theme';

export type Reply = {
  id: string;
  post_id: string;
  parent_reply_id: string | null;
  text: string;
  author: string;
  author_id: string;
  created_at: string;
};

export const REPLY_LEFT_PAD = 20;
export const REPLY_AVATAR_SIZE = 32;

export function ReplyCard({
  reply,
  date,
  onReply,
  showThreadLine,
  nested,
}: {
  reply: Reply;
  date: string;
  onReply?: () => void;
  showThreadLine?: boolean;
  nested?: boolean;
}) {
  return (
    <View style={[styles.card, nested && styles.cardNested]}>
      <View style={styles.leftCol}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{reply.author[0]}</Text>
        </View>
        {showThreadLine && <View style={styles.threadLine} />}
      </View>
      <View style={styles.rightCol}>
        <View style={styles.header}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingLeft: REPLY_LEFT_PAD,
    paddingRight: 20,
    paddingVertical: 12,
  },
  cardNested: { paddingLeft: 0 },
  leftCol: { width: REPLY_AVATAR_SIZE, alignItems: 'center', marginRight: 10 },
  avatar: {
    width: REPLY_AVATAR_SIZE,
    height: REPLY_AVATAR_SIZE,
    borderRadius: REPLY_AVATAR_SIZE / 2,
    backgroundColor: TLColors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: TLColors.white, fontWeight: '700', fontSize: 13 },
  threadLine: { flex: 1, width: 2, backgroundColor: '#ddd', marginTop: 6, borderRadius: 1 },
  rightCol: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  author: { fontSize: 14, fontWeight: '600', color: '#111', flex: 1 },
  date: { fontSize: 12, color: '#888' },
  text: { fontSize: 14, color: '#222', lineHeight: 20, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  actionLabel: { fontSize: 13, color: '#888' },
  actionIcon: { fontSize: 16, color: '#888' },
});
