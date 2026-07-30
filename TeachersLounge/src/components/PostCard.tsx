import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { TLColors } from '@/constants/theme';
import { Post } from '@/services/posts';
import { OptionsSheet } from '@/components/OptionsSheet';

export function PostCard({
  post, date, onPress, onReply, currentUserId, onDelete,
}: {
  post: Post;
  date: string;
  onPress?: () => void;
  onReply?: () => void;
  currentUserId?: string;
  onDelete?: () => void;
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const isOwner = !!currentUserId && currentUserId === post.author_id;

  const options = isOwner
    ? [{ label: 'Delete post', icon: '🗑️', danger: true, onPress: () => onDelete?.() }]
    : [
        { label: 'Share', icon: '↗️', onPress: () => {} },
        { label: 'Message', icon: '💬', onPress: () => {} },
        { label: 'Block user', icon: '🚫', danger: true, onPress: () => {} },
        { label: 'Report post', icon: '⚠️', danger: true, onPress: () => {} },
      ];

  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{post.author[0]}</Text></View>
        <Text style={styles.postAuthor}>{post.author}</Text>
        <View style={styles.topicBadge}><Text style={styles.topicBadgeText}>{post.topic}</Text></View>
        <Text style={styles.postDate}>{date}</Text>
      </View>
      <Text style={styles.postText}>{post.text}</Text>
      <View style={styles.postActions}>
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.actionLabel}>···</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionIcon}>🔖</Text><Text style={styles.actionLabel}>Save</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionIcon}>♡</Text><Text style={styles.actionLabel}>Like</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onReply}>
          <Text style={styles.actionIcon}>↪</Text><Text style={styles.actionLabel}>Reply</Text>
        </TouchableOpacity>
      </View>
      <OptionsSheet visible={menuVisible} onClose={() => setMenuVisible(false)} options={options} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  postCard: { padding: 20 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: TLColors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: TLColors.white, fontWeight: '700', fontSize: 14 },
  postAuthor: { fontSize: 14, fontWeight: '600', color: '#111' },
  topicBadge: { backgroundColor: '#e8f4f5', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3 },
  topicBadgeText: { fontSize: 12, color: TLColors.primary, fontWeight: '500' },
  postDate: { fontSize: 12, color: '#888', marginLeft: 'auto' },
  postText: { fontSize: 14, color: '#222', lineHeight: 20, marginBottom: 12 },
  postActions: { flexDirection: 'row', gap: 16, alignItems: 'center', justifyContent: 'flex-end' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 16, color: '#888' },
  actionLabel: { fontSize: 13, color: '#888' },
});
