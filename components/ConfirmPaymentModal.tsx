import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { CustomPicker } from './CustomPicker';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';

interface PaymentInfo {
  id: string;
  student_name: string;
  amount_expected: number;
  reference_month: string;
}

interface ConfirmPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  payment: PaymentInfo | null;
  onSuccess: () => void;
}

export const ConfirmPaymentModal: React.FC<ConfirmPaymentModalProps> = ({
  visible,
  onClose,
  payment,
  onSuccess,
}) => {
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (payment) {
      setAmountPaid(payment.amount_expected.toString());
      setPaymentDate(new Date());
      setPaymentMethod('pix');
      setNotes('');
    }
  }, [payment]);

  const handleConfirm = async () => {
    if (!payment) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('student_payments')
        .update({
          payment_status: 'paid',
          amount_paid: parseFloat(amountPaid),
          payment_date: format(paymentDate, 'yyyy-MM-dd'),
          payment_method: paymentMethod,
          notes: notes || null,
        })
        .eq('id', payment.id);

      if (error) throw error;
      Toast.show({ type: 'success', text1: 'Pagamento confirmado!' });
      onSuccess();
      onClose();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Erro ao confirmar pagamento', text2: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!payment) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Confirmar Pagamento</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Aluno</Text>
            <Text style={styles.infoValue}>{payment.student_name}</Text>
            <Text style={styles.infoLabel}>Mês de referência</Text>
            <Text style={styles.infoValue}>{payment.reference_month}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Valor Pago (R$)</Text>
            <TextInput
              style={styles.input}
              value={amountPaid}
              onChangeText={setAmountPaid}
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Data do Pagamento</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.inputText}>{format(paymentDate, 'dd/MM/yyyy')}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={paymentDate}
                mode="date"
                onChange={(_, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) setPaymentDate(date);
                }}
              />
            )}
          </View>

          <View style={styles.field}>
            <CustomPicker
              label="Método de Pagamento"
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              options={[
                { label: 'PIX', value: 'pix' },
                { label: 'Dinheiro', value: 'dinheiro' },
                { label: 'Transferência', value: 'transferencia' },
                { label: 'Manual', value: 'manual' },
              ]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Observações (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Digite observações sobre o pagamento..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isLoading}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleConfirm}
            disabled={isLoading}
          >
            <Text style={styles.confirmText}>
              {isLoading ? 'Confirmando...' : 'Confirmar Pagamento'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  scroll: { flex: 1, padding: 16 },
  infoCard: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  infoLabel: { fontSize: 11, color: Colors.primary, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 15, color: Colors.text, fontWeight: '600', marginBottom: 10 },
  field: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    fontSize: 15,
    color: Colors.text,
    justifyContent: 'center',
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  inputText: { fontSize: 15, color: Colors.text },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  confirmBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
