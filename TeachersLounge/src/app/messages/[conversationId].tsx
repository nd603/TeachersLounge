import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TLColors } from '@/constants/theme';

type Message = {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
};

export default function ConversationScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const listRef = useRef<FlatList>(null);

  const displayName = name ?? 'Chat';
  const initials = displayName[0]?.toUpperCase() ?? '?';

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text) return;
    const now = new Date();
    const time = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() < 12 ? 'AM' : 'PM'}`;
    setMessages(prev => [...prev, { id: String(Date.now()), text, fromMe: true, time }]);
    setInputText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.fromMe) {
      return (
        <View style={styles.msgRowRight}>
          <View style={styles.bubbleMe}>
            <Text style={styles.bubbleMeText}>{item.text}</Text>
          </View>
          <Text style={styles.timeRight}>{item.time}</Text>
        </View>
      );
    }
    return (
      <View style={styles.msgRowLeft}>
        <View style={styles.theirAvatar}>
          <Text style={styles.theirAvatarText}>{initials}</Text>
        </View>
        <View>
          <Text style={styles.theirName}>{displayName}</Text>
          <View style={styles.bubbleThem}>
            <Text style={styles.bubbleThemText}>{item.text}</Text>
          </View>
          <Text style={styles.timeLeft}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{displayName}</Text>
            <View style={styles.activeRow}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active now</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          ListHeaderComponent={
            messages.length > 0
              ? <View style={styles.dateRow}><Text style={styles.dateLabel}>Today</Text></View>
              : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyAvatar}>
                <Text style={styles.emptyAvatarText}>{initials}</Text>
              </View>
              <Text style={styles.emptyName}>{displayName}</Text>
              <Text style={styles.emptyHint}>Send a message to start the conversation</Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.inputIconBtn}>
            <Ionicons name="attach-outline" size={24} color="#888" />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Write your message"
            placeholderTextColor={TLColors.gray500}
            value={inputText}
            onChangeText={setInputText}
            multiline
            textAlign="left"
            onSubmitEditing={sendMessage}
          />
          {inputText.trim() ? (
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.inputRightIcons}>
              <TouchableOpacity style={styles.inputIconBtn}>
                <Ionicons name="camera-outline" size={24} color="#888" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.inputIconBtn}>
                <Ionicons name="mic-outline" size={24} color="#888" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginLeft: 12 },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: TLColors.gray300, alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  headerName: { fontSize: 15, fontWeight: '700', color: '#111' },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50' },
  activeText: { fontSize: 12, color: TLColors.gray500 },
  messagesList: { padding: 16, flexGrow: 1 },
  dateRow: { alignItems: 'center', marginBottom: 16 },
  dateLabel: { fontSize: 13, color: TLColors.gray500, fontWeight: '500' },
  msgRowRight: { alignItems: 'flex-end', marginBottom: 12 },
  bubbleMe: {
    backgroundColor: TLColors.primary, borderRadius: 18, borderBottomRightRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10, maxWidth: '75%',
  },
  bubbleMeText: { color: '#fff', fontSize: 15, lineHeight: 20 },
  timeRight: { fontSize: 11, color: TLColors.gray500, marginTop: 3 },
  msgRowLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  theirAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: TLColors.gray300, alignItems: 'center', justifyContent: 'center',
    marginTop: 16,
  },
  theirAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  theirName: { fontSize: 12, color: TLColors.gray500, marginBottom: 4, marginLeft: 2 },
  bubbleThem: {
    backgroundColor: '#f0f0f0', borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10, maxWidth: '75%',
  },
  bubbleThemText: { color: '#111', fontSize: 15, lineHeight: 20 },
  timeLeft: { fontSize: 11, color: TLColors.gray500, marginTop: 3, marginLeft: 2 },
  emptyContainer: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyAvatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: TLColors.gray300, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyAvatarText: { color: '#fff', fontWeight: '700', fontSize: 28 },
  emptyName: { fontSize: 18, fontWeight: '700', color: '#111' },
  emptyHint: { fontSize: 14, color: TLColors.gray500, textAlign: 'center', marginTop: 4 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff',
  },
  inputIconBtn: { padding: 4, marginBottom: 2 },
  textInput: {
    flex: 1, fontSize: 15, color: '#111',
    backgroundColor: '#f5f5f5', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    maxHeight: 100,
  },
  inputRightIcons: { flexDirection: 'row', alignItems: 'center' },
  sendBtn: {
    backgroundColor: TLColors.primary, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginBottom: 2,
  },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
