import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';

interface Student {
  id: string;
  name: string;
  level: string;
  class_days: string[] | null;
  class_time: string | null;
  status: string;
}

interface TimeSlot {
  time: string;
  students: Student[];
}

interface DaySchedule {
  day: string;
  dayLabel: string;
  slots: TimeSlot[];
}

const WEEK_DAYS = [
  { id: 'segunda', label: 'Segunda-feira' },
  { id: 'terca', label: 'Terça-feira' },
  { id: 'quarta', label: 'Quarta-feira' },
  { id: 'quinta', label: 'Quinta-feira' },
  { id: 'sexta', label: 'Sexta-feira' },
  { id: 'sabado', label: 'Sábado' },
  { id: 'domingo', label: 'Domingo' },
];

export default function ScheduleScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active')
        .not('class_days', 'is', null)
        .not('class_time', 'is', null);

      if (error) throw error;
      setStudents(data ?? []);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar cronograma', text2: err.message });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  const organizeSchedule = (): DaySchedule[] => {
    const schedule: DaySchedule[] = WEEK_DAYS.map((d) => ({ day: d.id, dayLabel: d.label, slots: [] }));

    students.forEach((student) => {
      if (!student.class_days || !student.class_time) return;
      const classTime = student.class_time; // narrowed to string after guard above
      student.class_days.forEach((day) => {
        const daySchedule = schedule.find((s) => s.day === day);
        if (!daySchedule) return;
        const existing = daySchedule.slots.find((sl) => sl.time === classTime);
        if (existing) {
          existing.students.push(student);
        } else {
          daySchedule.slots.push({ time: classTime, students: [student] });
        }
      });
    });

    schedule.forEach((d) => d.slots.sort((a, b) => a.time.localeCompare(b.time)));
    return schedule;
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const schedule = organizeSchedule();
  const totalClasses = schedule.reduce((acc, d) => acc + d.slots.length, 0);
  const activeDays = schedule.filter((d) => d.slots.length > 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
            <Text style={styles.summaryText}>{totalClasses} aulas/semana</Text>
          </View>
          <View style={styles.summaryChip}>
            <Ionicons name="people-outline" size={14} color={Colors.primary} />
            <Text style={styles.summaryText}>{students.length} alunos ativos</Text>
          </View>
        </View>

        {students.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={52} color={Colors.border} />
            <Text style={styles.emptyTitle}>Nenhuma aula agendada</Text>
            <Text style={styles.emptySubtitle}>
              Cadastre alunos com horários para ver o cronograma
            </Text>
          </View>
        ) : (
          activeDays.map((day) => (
            <View key={day.day} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Ionicons name="calendar" size={16} color={Colors.primary} />
                <Text style={styles.dayTitle}>{day.dayLabel}</Text>
              </View>
              {day.slots.length === 0 ? (
                <Text style={styles.noSlots}>Sem aulas agendadas</Text>
              ) : (
                day.slots.map((slot, idx) => (
                  <View key={idx} style={styles.slot}>
                    <View style={styles.slotHeader}>
                      <View style={styles.slotTime}>
                        <Ionicons name="time-outline" size={14} color={Colors.primary} />
                        <Text style={styles.slotTimeText}>{slot.time}</Text>
                      </View>
                      <View style={styles.confirmedBadge}>
                        <Text style={styles.confirmedText}>Confirmada</Text>
                      </View>
                    </View>
                    {slot.students.map((student) => (
                      <View key={student.id} style={styles.studentRow}>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <View style={styles.levelBadge}>
                          <Text style={styles.levelText}>{student.level}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ))
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inner: { padding: 16 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  summaryText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textMuted, marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  dayCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: Colors.muted,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  noSlots: { padding: 14, color: Colors.textMuted, fontSize: 13, textAlign: 'center' },
  slot: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  slotTimeText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  confirmedBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  confirmedText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.muted,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 4,
  },
  studentName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  levelBadge: {
    backgroundColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  levelText: { fontSize: 11, color: Colors.textMuted },
});
