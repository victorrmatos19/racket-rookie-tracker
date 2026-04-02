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
import Toast from 'react-native-toast-message';
import { format, parse } from 'date-fns';
import { Expense } from '@/types/database';

interface EditExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  expense: Expense;
  onUpdated: () => void;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  visible,
  onClose,
  expense,
  onUpdated,
}) => {
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [category, setCategory] = useState(expense.category ?? '');
  const [expenseDate, setExpenseDate] = useState(
    parse(expense.expense_date, 'yyyy-MM-dd', new Date())
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setCategory(expense.category ?? '');
      setExpenseDate(parse(expense.expense_date, 'yyyy-MM-dd', new Date()));
    }
  }, [visible, expense]);

  const handleSubmit = async () => {
    if (!description || !amount) {
      Toast.show({ type: 'error', text1: 'Preencha a descrição e o valor' });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          description,
          amount: parseFloat(amount),
          category: category || null,
          expense_date: format(expenseDate, 'yyyy-MM-dd'),
        })
        .eq('id', expense.id);

      if (error) throw error;
      Toast.show({ type: 'success', text1: 'Despesa atualizada!' });
      onUpdated();
      onClose();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Erro ao atualizar despesa', text2: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Editar Despesa</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll}>
          <View style={styles.field}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Valor (R$)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Categoria</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="Opcional"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Data</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.inputText}>{format(expenseDate, 'dd/MM/yyyy')}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={expenseDate}
                mode="date"
                onChange={(_, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) setExpenseDate(date);
                }}
              />
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitText}>{isLoading ? 'Salvando...' : 'Salvar Alterações'}</Text>
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
  inputText: { fontSize: 15, color: Colors.text },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
