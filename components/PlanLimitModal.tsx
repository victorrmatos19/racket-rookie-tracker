import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface PlanLimitModalProps {
  visible: boolean;
  onClose: () => void;
  currentCount: number;
  limit: number;
  planName: string;
}

export const PlanLimitModal: React.FC<PlanLimitModalProps> = ({
  visible,
  onClose,
  currentCount,
  limit,
  planName,
}) => {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/plans');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed" size={32} color={Colors.warning} />
          </View>

          <Text style={styles.title}>Limite atingido</Text>
          <Text style={styles.body}>
            O plano <Text style={styles.bold}>{planName}</Text> permite até{' '}
            <Text style={styles.bold}>{limit} alunos</Text>. Você já tem{' '}
            <Text style={styles.bold}>{currentCount}</Text> alunos cadastrados.
          </Text>
          <Text style={styles.body}>
            Faça upgrade para o plano <Text style={styles.bold}>Pro</Text> ou{' '}
            <Text style={styles.bold}>Academy</Text> e cadastre alunos ilimitados.
          </Text>

          <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
            <Ionicons name="arrow-up-circle-outline" size={18} color={Colors.white} />
            <Text style={styles.upgradeBtnText}>Ver planos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.warningBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  body: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  bold: { fontWeight: '700', color: Colors.text },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 28,
    width: '100%',
    justifyContent: 'center',
    marginTop: 4,
  },
  upgradeBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  cancelBtn: { paddingVertical: 8 },
  cancelBtnText: { color: Colors.textMuted, fontSize: 14 },
});
