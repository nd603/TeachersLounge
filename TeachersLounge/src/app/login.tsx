import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TLColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { Alert.alert('Login failed', error.message); return; }
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Log In</Text>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="user@school.edu"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
      </View>

      <TouchableOpacity style={[styles.btnFilled, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
        <Text style={styles.btnFilledText}>{loading ? 'Logging in…' : 'Log In'}</Text>
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
