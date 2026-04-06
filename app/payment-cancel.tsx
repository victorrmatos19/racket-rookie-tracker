import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export default function PaymentCancelScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Ionicons name="close-circle-outline" size={56} color={Colors.textMuted} />
      <Text style={styles.title}>Pagamento cancelado</Text>
      <Text style={styles.sub}>Você pode assinar a qualquer momento.</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.replace('/plans')}>
        <Text style={styles.btnText}>Ver planos</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.backText}>Voltar ao app</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 32, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  sub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  btn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 32, marginTop: 8 },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  backText: { color: Colors.textMuted, fontSize: 14, marginTop: 4 },
});
