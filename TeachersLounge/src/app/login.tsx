import { useRouter } from 'expo-router';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TLColors } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Log In</Text>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="user@school.edu" keyboardType="email-address" autoCapitalize="none" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="Password" secureTextEntry />
        </View>
      </View>

      <TouchableOpacity style={styles.btnFilled} onPress={() => router.replace('/(tabs)/home')}>
        <Text style={styles.btnFilledText}>Log In</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TLColors.white, paddingHorizontal: 24 },
  back: { marginTop: 8, marginBottom: 24 },
  backText: { fontSize: 24, color: TLColors.black },
  title: { fontSize: 26, fontWeight: '700', color: TLColors.black, marginBottom: 32 },
  form: { gap: 16, marginBottom: 32 },
  field: { gap: 6 },
  label: { fontSize: 13, color: TLColors.gray700 },
  input: {
    borderWidth: 1.5, borderColor: TLColors.gray300, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
  btnFilled: {
    backgroundColor: TLColors.primary, borderRadius: 50,
    paddingVertical: 16, alignItems: 'center',
  },
  btnFilledText: { color: TLColors.white, fontSize: 17, fontWeight: '600' },
});
