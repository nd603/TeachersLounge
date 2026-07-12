import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TLColors } from '@/constants/theme';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoArea}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>☕</Text>
        </View>
        <Text style={styles.appName}>{"Teachers'\nLounge"}</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btnOutline} onPress={() => router.push('/login')}>
          <Text style={styles.btnOutlineText}>Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnFilled} onPress={() => router.push('/signup')}>
          <Text style={styles.btnFilledText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TLColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: TLColors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 56,
  },
  appName: {
    fontSize: 40,
    fontWeight: '700',
    color: TLColors.primary,
    textAlign: 'center',
    lineHeight: 46,
  },
  buttons: {
    width: '100%',
    gap: 14,
  },
  btnOutline: {
    borderWidth: 2,
    borderColor: TLColors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnOutlineText: {
    color: TLColors.primary,
    fontSize: 17,
    fontWeight: '600',
  },
  btnFilled: {
    backgroundColor: TLColors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnFilledText: {
    color: TLColors.white,
    fontSize: 17,
    fontWeight: '600',
  },
});
