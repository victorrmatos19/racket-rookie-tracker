import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { EditStudentModal } from './EditStudentModal';

const DAYS_MAP: Record<string, string> = {
  segunda: 'Seg',
  terca: 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  sabado: 'Sáb',
  domingo: 'Dom',
};

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: 'Ativo', bg: '#f0fdf4', color: '#16a34a' },
  inactive: { label: 'Inativo', bg: '#f3f4f6', color: '#6b7280' },
  improving: { label: 'Evoluindo', bg: '#eff6ff', color: '#3b82f6' },
  pending: { label: 'Pendente', bg: '#fffbeb', color: '#d97706' },
};

const TENNIS_SKILLS = [
  { key: 'forehandProgress', label: 'Forehand' },
  { key: 'backhandProgress', label: 'Backhand' },
  { key: 'serveProgress', label: 'Saque' },
  { key: 'volleyProgress', label: 'Voleio' },
  { key: 'sliceProgress', label: 'Slice' },
  { key: 'physicalProgress', label: 'Físico' },
  { key: 'tacticalProgress', label: 'Tático' },
];

interface StudentCardProps {
  id: string;
  name: string;
  level: string;
  progress: number;
  classDays: string[];
  classTime: string;
  classStartDate: string;
  status: 'active' | 'inactive' | 'improving' | 'pending';
  monthlyFee: number;
  forehandProgress: number;
  backhandProgress: number;
  serveProgress: number;
  volleyProgress: number;
  sliceProgress: number;
  physicalProgress: number;
  tacticalProgress: number;
  onRefresh: () => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  id,
  name,
  level,
  progress,
  classDays,
  classTime,
  classStartDate,
  status,
  monthlyFee,
  forehandProgress,
  backhandProgress,
  serveProgress,
  volleyProgress,
  sliceProgress,
  physicalProgress,
  tacticalProgress,
  onRefresh,
}) => {
  const [editVisible, setEditVisible] = useState(false);
  const statusInfo = statusConfig[status] ?? statusConfig.active;
  const daysLabel = classDays.map((d) => DAYS_MAP[d] ?? d).join(', ');

  const skillsData = {
    forehandProgress,
    backhandProgress,
    serveProgress,
    volleyProgress,
    sliceProgress,
    physicalProgress,
    tacticalProgress,
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Aluno',
      `Tem certeza que deseja excluir ${name}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('students').delete().eq('id', id);
            if (error) {
              Toast.show({ type: 'error', text1: 'Erro ao excluir aluno', text2: error.message });
            } else {
              Toast.show({ type: 'success', text1: 'Aluno excluído com sucesso' });
              onRefresh();
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.levelRow}>
            <Ionicons name="trophy-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.level}> {level}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.badge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.badgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setEditVisible(true)}>
            <Ionicons name="pencil-outline" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Skills */}
      <View style={styles.skillsSection}>
        <Text style={styles.sectionLabel}>Habilidades</Text>
        <View style={styles.skillsGrid}>
          {TENNIS_SKILLS.map((skill) => {
            const val = skillsData[skill.key as keyof typeof skillsData] ?? 0;
            return (
              <View key={skill.key} style={styles.skillItem}>
                <View style={styles.skillHeader}>
                  <Text style={styles.skillLabel}>{skill.label}</Text>
                  <Text style={styles.skillValue}>{val}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${val}%` as any }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Schedule */}
      <View style={styles.schedule}>
        <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
        <View style={{ marginLeft: 6 }}>
          {classDays.length > 0 ? (
            <>
              <Text style={styles.scheduleText}>{daysLabel}</Text>
              <Text style={styles.scheduleTime}>{classTime}</Text>
            </>
          ) : (
            <Text style={styles.scheduleText}>Sem aulas agendadas</Text>
          )}
        </View>
      </View>

      <EditStudentModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        student={{
          id,
          name,
          level,
          status,
          class_days: classDays,
          class_time: classTime,
          class_start_date: classStartDate,
          monthly_fee: monthlyFee,
          forehand_progress: forehandProgress,
          backhand_progress: backhandProgress,
          serve_progress: serveProgress,
          volley_progress: volleyProgress,
          slice_progress: sliceProgress,
          physical_progress: physicalProgress,
          tactical_progress: tacticalProgress,
          user_id: '',
          progress,
          created_at: '',
          updated_at: '',
        }}
        onUpdated={() => {
          setEditVisible(false);
          onRefresh();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerLeft: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 3,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  level: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.muted,
  },
  skillsSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  skillsGrid: {
    gap: 8,
  },
  skillItem: {
    gap: 4,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skillLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  skillValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressTrack: {
    height: 5,
    backgroundColor: Colors.muted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  schedule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  scheduleText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  scheduleTime: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
