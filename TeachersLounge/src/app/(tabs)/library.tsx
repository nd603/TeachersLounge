import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TLColors } from '@/constants/theme';

export default function LibraryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Library — coming soon</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TLColors.white, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18, color: TLColors.gray500 },
});
