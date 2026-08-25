import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TLColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function NotificationBell() {
  const router = useRouter();
  const [count, setCount] = useState(0);

  useFocusEffect(useCallback(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count: n } = await supabase
        .from('lounge_connections')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('status', 'pending');
      setCount(n ?? 0);
    })();
  }, []));

  return (
    <TouchableOpacity onPress={() => router.push('/lounge-requests')} style={styles.wrap}>
      <Ionicons name="notifications-outline" size={24} color="#111" />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  badge: {
    position: 'absolute', top: -4, right: -6,
    backgroundColor: TLColors.danger,
    borderRadius: 10, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
