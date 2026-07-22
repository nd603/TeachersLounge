import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TLColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.comingSoon}>More profile features coming soon</Text>
      <TouchableOpacity style={styles.btnSignOut} onPress={handleSignOut}>
        <Text style={styles.btnSignOutText}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TLColors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: '700', color: TLColors.black, marginBottom: 8 },
  comingSoon: { fontSize: 14, color: TLColors.gray500, marginBottom: 48 },
  btnSignOut: {
    borderWidth: 1.5, borderColor: TLColors.danger, borderRadius: 50,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  btnSignOutText: { color: TLColors.danger, fontSize: 16, fontWeight: '600' },
});
