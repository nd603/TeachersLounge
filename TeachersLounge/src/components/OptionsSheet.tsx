import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type OptionItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  danger?: boolean;
};

export function OptionsSheet({
  visible,
  onClose,
  options,
}: {
  visible: boolean;
  onClose: () => void;
  options: OptionItem[];
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        {options.map((opt, i) => (
          <TouchableOpacity
            key={opt.label}
            style={[styles.option, i > 0 && styles.optionBorder]}
            onPress={() => { onClose(); opt.onPress(); }}
            activeOpacity={0.7}
          >
            <Ionicons name={opt.icon} size={22} color={opt.danger ? '#e53935' : '#111'} style={styles.icon} />
            <Text style={[styles.label, opt.danger && styles.dangerLabel]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.cancelGap} />
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#ddd', alignSelf: 'center', marginBottom: 16,
  },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16,
  },
  optionBorder: { borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  icon: { width: 28, textAlign: 'center' },
  label: { fontSize: 16, color: '#111', fontWeight: '400' },
  dangerLabel: { color: '#e53935' },
  cancelGap: { height: 8, backgroundColor: '#f5f5f5', marginHorizontal: -20, marginTop: 8 },
  cancelBtn: { paddingVertical: 16, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#111' },
});
