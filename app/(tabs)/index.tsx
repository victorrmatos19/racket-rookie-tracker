import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { Student } from '@/types/database';
import { StudentCard } from '@/components/StudentCard';
import { StatsCard } from '@/components/StatsCard';
import { AddStudentModal } from '@/components/AddStudentModal';
import { PlanLimitModal } from '@/components/PlanLimitModal';
import { useSubscription } from '@/hooks/useSubscription';
import Toast from 'react-native-toast-message';

const PAGE_SIZE = 10;

export default function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const { subscription, plan, isLoading: subLoading } = useSubscription();

  const handleAddStudent = () => {
    if (!subLoading && plan?.max_students !== null && plan !== null) {
      const activeCount = students.filter((s) => s.status === 'active').length;
      if (activeCount >= plan.max_students) {
        setLimitModalVisible(true);
        return;
      }
    }
    setAddModalVisible(true);
  };

  const fetchStudents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data ?? []);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar alunos', text2: err.message });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Debounce search — 300ms delay avoids filtering on every keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const pagedStudents = filteredStudents.slice(0, currentPage * PAGE_SIZE);
  const hasMore = currentPage < totalPages;

  const activeStudents = students.filter((s) => s.status === 'active').length;
  const activePercent =
    students.length > 0 ? Math.round((activeStudents / students.length) * 100) : 0;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando alunos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={pagedStudents}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Stats */}
            <View style={styles.statsRow}>
              <StatsCard
                title="Total de Alunos"
                value={students.length}
                subtitle={`${students.length} cadastrados`}
              />
              <View style={{ width: 12 }} />
              <StatsCard
                title="Alunos Ativos"
                value={activeStudents}
                subtitle={`${activePercent}% do total`}
                valueColor={Colors.primary}
              />
            </View>

            {/* Header row */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Meus Alunos</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleAddStudent}
              >
                <Ionicons name="add" size={18} color={Colors.white} />
                <Text style={styles.addBtnText}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Buscar aluno por nome..."
                placeholderTextColor={Colors.textMuted}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <StudentCard
            id={item.id}
            name={item.name}
            level={item.level}
            progress={item.progress}
            classDays={item.class_days ?? []}
            classTime={item.class_time ?? ''}
            classStartDate={item.class_start_date}
            status={item.status as any}
            monthlyFee={item.monthly_fee}
            forehandProgress={item.forehand_progress}
            backhandProgress={item.backhand_progress}
            serveProgress={item.serve_progress}
            volleyProgress={item.volley_progress}
            sliceProgress={item.slice_progress}
            physicalProgress={item.physical_progress}
            tacticalProgress={item.tactical_progress}
            onRefresh={fetchStudents}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>
              {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado ainda'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchTerm
                ? 'Tente buscar com outro nome'
                : 'Toque em "Adicionar" para começar'}
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity
              style={styles.loadMore}
              onPress={() => setCurrentPage((p) => p + 1)}
            >
              <Text style={styles.loadMoreText}>Carregar mais ({filteredStudents.length - pagedStudents.length} restantes)</Text>
            </TouchableOpacity>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />

      <AddStudentModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdded={fetchStudents}
      />
      {plan?.max_students !== null && plan !== null && (
        <PlanLimitModal
          visible={limitModalVisible}
          onClose={() => setLimitModalVisible(false)}
          currentCount={students.filter((s) => s.status === 'active').length}
          limit={plan.max_students!}
          planName={plan.name}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: 12, color: Colors.textMuted, fontSize: 14 },
  listContent: { padding: 16, paddingBottom: 24 },
  listHeader: { marginBottom: 8 },
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textMuted, marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  loadMore: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
});
