import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TLColors } from '@/constants/theme';
import { OptionsSheet } from '@/components/OptionsSheet';

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
  currentUserId,
  onDelete,
  liked,
  likeCount,
  onLike,
  onAuthorPress,
}: {
  reply: Reply;
  date: string;
  onReply?: () => void;
  showThreadLine?: boolean;
  nested?: boolean;
  currentUserId?: string;
  onDelete?: () => void;
  liked?: boolean;
  likeCount?: number;
  onLike?: () => void;
  onAuthorPress?: () => void;
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const isOwner = !!currentUserId && currentUserId === reply.author_id;

  const options = isOwner
    ? [{ label: 'Delete reply', icon: 'trash-outline' as const, danger: true, onPress: () => onDelete?.() }]
    : [
        { label: 'Share', icon: 'share-outline' as const, onPress: () => {} },
        { label: 'Message', icon: 'chatbubble-outline' as const, onPress: () => {} },
        { label: 'Block user', icon: 'ban-outline' as const, danger: true, onPress: () => {} },
        { label: 'Report reply', icon: 'flag-outline' as const, danger: true, onPress: () => {} },
      ];

  return (
    <View style={[styles.card, showThreadLine && styles.cardNoBottomPad, nested && styles.cardNested]}>
      <TouchableOpacity style={styles.leftCol} onPress={onAuthorPress} disabled={!onAuthorPress} activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{reply.author[0]}</Text>
        </View>
        {showThreadLine && <View style={styles.threadLine} />}
      </TouchableOpacity>
      <View style={styles.rightCol}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onAuthorPress} disabled={!onAuthorPress}>
            <Text style={styles.author}>{reply.author}</Text>
          </TouchableOpacity>
          <Text style={styles.date}>{date}</Text>
        </View>
        <Text style={styles.text}>{reply.text}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="ellipsis-horizontal" size={16} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity><Ionicons name="bookmark-outline" size={16} color="#888" /></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? '#111' : '#888'} />
            {likeCount ? <Text style={[styles.actionCount, liked && { color: '#111' }]}>{likeCount}</Text> : null}
          </TouchableOpacity>
          <TouchableOpacity onPress={onReply}><Ionicons name="arrow-undo-outline" size={16} color="#888" /></TouchableOpacity>
        </View>
      </View>
      <OptionsSheet visible={menuVisible} onClose={() => setMenuVisible(false)} options={options} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingLeft: REPLY_LEFT_PAD,
    paddingRight: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  cardNoBottomPad: { paddingBottom: 0 },
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
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { fontSize: 12, color: '#888' },
});
