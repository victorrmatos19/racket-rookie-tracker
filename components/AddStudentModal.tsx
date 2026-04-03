import React, { useState } from 'react';
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
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { CustomPicker } from './CustomPicker';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';
import { z } from 'zod';
import {
  WEEK_DAYS,
  TENNIS_SKILLS_FORM,
  STUDENT_LEVELS,
  STUDENT_STATUSES,
  MAX_MONTHLY_FEE,
} from '@/constants';

// ─── Validation schema ────────────────────────────────────────────────────────
const AddStudentSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome muito longo'),
  level: z.string().min(1, 'Selecione o nível do aluno'),
  monthlyFee: z
    .string()
    .refine(
      (v) => {
        if (v === '' || v === '0') return true;
        const n = parseFloat(v.replace(',', '.'));
        return !isNaN(n) && n >= 0 && n <= MAX_MONTHLY_FEE;
      },
      { message: `Valor inválido (máximo R$ ${MAX_MONTHLY_FEE.toLocaleString('pt-BR')})` }
    ),
});

interface AddStudentModalProps {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
}

const initialForm = {
  name: '',
  level: '',
  classDays: [] as string[],
  classTime: new Date(2000, 0, 1, 8, 0),
  showTimePicker: false,
  classStartDate: new Date(),
  showDatePicker: false,
  status: 'active',
  monthlyFee: '',
  forehandProgress: 0,
  backhandProgress: 0,
  serveProgress: 0,
  volleyProgress: 0,
  sliceProgress: 0,
  physicalProgress: 0,
  tacticalProgress: 0,
};

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ visible, onClose, onAdded }) => {
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);

  const toggleDay = (dayId: string) => {
    setForm((prev) => ({
      ...prev,
      classDays: prev.classDays.includes(dayId)
        ? prev.classDays.filter((d) => d !== dayId)
        : [...prev.classDays, dayId],
    }));
  };

  const handleSubmit = async () => {
    // Validate before sending to backend
    const result = AddStudentSchema.safeParse({
      name: form.name.trim(),
      level: form.level,
      monthlyFee: form.monthlyFee,
    });

    if (!result.success) {
      const firstError = result.error.errors[0]?.message ?? 'Dados inválidos';
      Toast.show({ type: 'error', text1: firstError });
      return;
    }

    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão expirada. Faça login novamente.');

      const classTimeStr = `${form.classTime.getHours().toString().padStart(2, '0')}:${form.classTime.getMinutes().toString().padStart(2, '0')}`;
      const feeValue = parseFloat(form.monthlyFee.replace(',', '.')) || 0;

      const { error } = await supabase.from('students').insert({
        user_id: user.id,
        name: form.name.trim(),
        level: form.level,
        progress: 0,
        class_days: form.classDays,
        class_time: classTimeStr,
        status: form.status,
        monthly_fee: feeValue,
        class_start_date: format(form.classStartDate, 'yyyy-MM-dd'),
        forehand_progress: Math.round(form.forehandProgress),
        backhand_progress: Math.round(form.backhandProgress),
        serve_progress: Math.round(form.serveProgress),
        volley_progress: Math.round(form.volleyProgress),
        slice_progress: Math.round(form.sliceProgress),
        physical_progress: Math.round(form.physicalProgress),
        tactical_progress: Math.round(form.tacticalProgress),
      });

      if (error) throw error;
      Toast.show({ type: 'success', text1: 'Aluno cadastrado com sucesso!' });
      setForm(initialForm);
      onAdded();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar aluno';
      if (__DEV__) console.error('[AddStudentModal]', err);
      Toast.show({ type: 'error', text1: 'Erro ao cadastrar aluno', text2: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Novo Aluno</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Nome */}
          <View style={styles.field}>
            <Text style={styles.label}>Nome *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="Nome do aluno"
              placeholderTextColor={Colors.textMuted}
              maxLength={100}
              autoCorrect={false}
            />
          </View>

          {/* Nível */}
          <View style={styles.field}>
            <CustomPicker
              label="Nível *"
              value={form.level}
              onValueChange={(v) => setForm({ ...form, level: v })}
              placeholder="Selecione o nível"
              options={STUDENT_LEVELS}
            />
          </View>

          {/* Status */}
          <View style={styles.field}>
            <CustomPicker
              label="Status"
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
              options={STUDENT_STATUSES}
            />
          </View>

          {/* Valor Mensal */}
          <View style={styles.field}>
            <Text style={styles.label}>Valor Mensal (R$)</Text>
            <TextInput
              style={styles.input}
              value={form.monthlyFee}
              onChangeText={(v) => setForm({ ...form, monthlyFee: v })}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
              maxLength={10}
            />
          </View>

          {/* Dias das Aulas */}
          <View style={styles.field}>
            <Text style={styles.label}>Dias das Aulas</Text>
            <View style={styles.daysRow}>
              {WEEK_DAYS.map((day) => {
                const selected = form.classDays.includes(day.id);
                return (
                  <TouchableOpacity
                    key={day.id}
                    style={[styles.dayBtn, selected && styles.dayBtnSelected]}
                    onPress={() => toggleDay(day.id)}
                  >
                    <Text style={[styles.dayText, selected && styles.dayTextSelected]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Horário */}
          <View style={styles.field}>
            <Text style={styles.label}>Horário das Aulas</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setForm({ ...form, showTimePicker: true })}
            >
              <Text style={styles.inputText}>
                {`${form.classTime.getHours().toString().padStart(2, '0')}:${form.classTime.getMinutes().toString().padStart(2, '0')}`}
              </Text>
            </TouchableOpacity>
            {form.showTimePicker && (
              <DateTimePicker
                value={form.classTime}
                mode="time"
                is24Hour
                onChange={(_, date) => {
                  setForm({
                    ...form,
                    showTimePicker: Platform.OS === 'ios',
                    classTime: date ?? form.classTime,
                  });
                }}
              />
            )}
          </View>

          {/* Data de Início */}
          <View style={styles.field}>
            <Text style={styles.label}>Início na Aula</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setForm({ ...form, showDatePicker: true })}
            >
              <Text style={styles.inputText}>{format(form.classStartDate, 'dd/MM/yyyy')}</Text>
            </TouchableOpacity>
            {form.showDatePicker && (
              <DateTimePicker
                value={form.classStartDate}
                mode="date"
                onChange={(_, date) => {
                  setForm({
                    ...form,
                    showDatePicker: Platform.OS === 'ios',
                    classStartDate: date ?? form.classStartDate,
                  });
                }}
              />
            )}
          </View>

          {/* Skills */}
          <View style={styles.field}>
            <Text style={styles.label}>Progresso por Habilidade</Text>
            {TENNIS_SKILLS_FORM.map((skill) => {
              const val = form[skill.key as keyof typeof form] as number;
              return (
                <View key={skill.key} style={styles.skillRow}>
                  <View style={styles.skillHeader}>
                    <Text style={styles.skillLabel}>{skill.label}</Text>
                    <Text style={styles.skillValue}>{Math.round(val)}%</Text>
                  </View>
                  <Slider
                    value={val}
                    onValueChange={(v) => setForm({ ...form, [skill.key]: v })}
                    minimumValue={0}
                    maximumValue={100}
                    step={5}
                    minimumTrackTintColor={Colors.primary}
                    maximumTrackTintColor={Colors.border}
                    thumbTintColor={Colors.primary}
                    style={{ height: 30 }}
                  />
                </View>
              );
            })}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Submit */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitText}>{isLoading ? 'Cadastrando...' : 'Cadastrar Aluno'}</Text>
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
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  dayBtnSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayText: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  dayTextSelected: { color: Colors.white },
  skillRow: { marginBottom: 12 },
  skillHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  skillLabel: { fontSize: 13, color: Colors.text },
  skillValue: { fontSize: 13, fontWeight: '700', color: Colors.primary },
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
