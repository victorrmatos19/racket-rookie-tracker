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
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { CustomPicker } from './CustomPicker';
import Toast from 'react-native-toast-message';
import { format, parse } from 'date-fns';
import { Student } from '@/types/database';

const WEEK_DAYS = [
  { id: 'segunda', label: 'Seg' },
  { id: 'terca', label: 'Ter' },
  { id: 'quarta', label: 'Qua' },
  { id: 'quinta', label: 'Qui' },
  { id: 'sexta', label: 'Sex' },
  { id: 'sabado', label: 'Sáb' },
  { id: 'domingo', label: 'Dom' },
];

const TENNIS_SKILLS = [
  { key: 'forehand_progress', label: 'Forehand' },
  { key: 'backhand_progress', label: 'Backhand' },
  { key: 'serve_progress', label: 'Saque' },
  { key: 'volley_progress', label: 'Voleio' },
  { key: 'slice_progress', label: 'Slice' },
  { key: 'physical_progress', label: 'Físico' },
  { key: 'tactical_progress', label: 'Tático' },
];

interface EditStudentModalProps {
  visible: boolean;
  onClose: () => void;
  student: Student;
  onUpdated: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  visible,
  onClose,
  student,
  onUpdated,
}) => {
  const parseTimeToDate = (timeStr: string | null) => {
    if (!timeStr) return new Date(2000, 0, 1, 8, 0);
    const [h, m] = timeStr.split(':').map(Number);
    return new Date(2000, 0, 1, h || 8, m || 0);
  };

  const [form, setForm] = useState({
    name: student.name,
    level: student.level,
    status: student.status,
    class_days: student.class_days ?? [],
    class_time: parseTimeToDate(student.class_time),
    showTimePicker: false,
    class_start_date: student.class_start_date
      ? parse(student.class_start_date, 'yyyy-MM-dd', new Date())
      : new Date(),
    showDatePicker: false,
    monthly_fee: student.monthly_fee?.toString() ?? '',
    forehand_progress: student.forehand_progress,
    backhand_progress: student.backhand_progress,
    serve_progress: student.serve_progress,
    volley_progress: student.volley_progress,
    slice_progress: student.slice_progress,
    physical_progress: student.physical_progress,
    tactical_progress: student.tactical_progress,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm({
        name: student.name,
        level: student.level,
        status: student.status,
        class_days: student.class_days ?? [],
        class_time: parseTimeToDate(student.class_time),
        showTimePicker: false,
        class_start_date: student.class_start_date
          ? parse(student.class_start_date, 'yyyy-MM-dd', new Date())
          : new Date(),
        showDatePicker: false,
        monthly_fee: student.monthly_fee?.toString() ?? '',
        forehand_progress: student.forehand_progress,
        backhand_progress: student.backhand_progress,
        serve_progress: student.serve_progress,
        volley_progress: student.volley_progress,
        slice_progress: student.slice_progress,
        physical_progress: student.physical_progress,
        tactical_progress: student.tactical_progress,
      });
    }
  }, [visible, student]);

  const toggleDay = (dayId: string) => {
    setForm((prev) => ({
      ...prev,
      class_days: prev.class_days.includes(dayId)
        ? prev.class_days.filter((d) => d !== dayId)
        : [...prev.class_days, dayId],
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const classTimeStr = `${form.class_time.getHours().toString().padStart(2, '0')}:${form.class_time.getMinutes().toString().padStart(2, '0')}`;

      const { error } = await supabase
        .from('students')
        .update({
          name: form.name,
          level: form.level,
          status: form.status,
          class_days: form.class_days,
          class_time: classTimeStr,
          class_start_date: format(form.class_start_date, 'yyyy-MM-dd'),
          monthly_fee: parseFloat(form.monthly_fee) || 0,
          forehand_progress: form.forehand_progress,
          backhand_progress: form.backhand_progress,
          serve_progress: form.serve_progress,
          volley_progress: form.volley_progress,
          slice_progress: form.slice_progress,
          physical_progress: form.physical_progress,
          tactical_progress: form.tactical_progress,
        })
        .eq('id', student.id);

      if (error) throw error;
      Toast.show({ type: 'success', text1: 'Aluno atualizado com sucesso!' });
      onUpdated();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Erro ao atualizar aluno', text2: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Editar Aluno</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.field}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <CustomPicker
              label="Nível"
              value={form.level}
              onValueChange={(v) => setForm({ ...form, level: v })}
              options={[
                { label: 'Iniciante', value: 'Iniciante' },
                { label: 'Intermediário', value: 'Intermediário' },
                { label: 'Avançado', value: 'Avançado' },
              ]}
            />
          </View>

          <View style={styles.field}>
            <CustomPicker
              label="Status"
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
              options={[
                { label: 'Ativo', value: 'active' },
                { label: 'Inativo', value: 'inactive' },
                { label: 'Pendente', value: 'pending' },
              ]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Valor Mensal (R$)</Text>
            <TextInput
              style={styles.input}
              value={form.monthly_fee}
              onChangeText={(v) => setForm({ ...form, monthly_fee: v })}
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Dias das Aulas</Text>
            <View style={styles.daysRow}>
              {WEEK_DAYS.map((day) => {
                const selected = form.class_days.includes(day.id);
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

          <View style={styles.field}>
            <Text style={styles.label}>Horário das Aulas</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setForm({ ...form, showTimePicker: true })}
            >
              <Text style={styles.inputText}>
                {`${form.class_time.getHours().toString().padStart(2, '0')}:${form.class_time.getMinutes().toString().padStart(2, '0')}`}
              </Text>
            </TouchableOpacity>
            {form.showTimePicker && (
              <DateTimePicker
                value={form.class_time}
                mode="time"
                is24Hour
                onChange={(_, date) => {
                  setForm({ ...form, showTimePicker: Platform.OS === 'ios', class_time: date ?? form.class_time });
                }}
              />
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Início na Aula</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setForm({ ...form, showDatePicker: true })}
            >
              <Text style={styles.inputText}>
                {format(form.class_start_date, 'dd/MM/yyyy')}
              </Text>
            </TouchableOpacity>
            {form.showDatePicker && (
              <DateTimePicker
                value={form.class_start_date}
                mode="date"
                onChange={(_, date) => {
                  setForm({ ...form, showDatePicker: Platform.OS === 'ios', class_start_date: date ?? form.class_start_date });
                }}
              />
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Progresso por Habilidade</Text>
            {TENNIS_SKILLS.map((skill) => {
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
