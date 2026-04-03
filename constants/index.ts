// Shared constants used across multiple components

export const WEEK_DAYS = [
  { id: 'segunda', label: 'Seg' },
  { id: 'terca', label: 'Ter' },
  { id: 'quarta', label: 'Qua' },
  { id: 'quinta', label: 'Qui' },
  { id: 'sexta', label: 'Sex' },
  { id: 'sabado', label: 'Sáb' },
  { id: 'domingo', label: 'Dom' },
];

// For AddStudentModal form state (camelCase keys)
export const TENNIS_SKILLS_FORM = [
  { key: 'forehandProgress', label: 'Forehand' },
  { key: 'backhandProgress', label: 'Backhand' },
  { key: 'serveProgress', label: 'Saque' },
  { key: 'volleyProgress', label: 'Voleio' },
  { key: 'sliceProgress', label: 'Slice' },
  { key: 'physicalProgress', label: 'Físico' },
  { key: 'tacticalProgress', label: 'Tático' },
];

// For EditStudentModal form state (snake_case DB column names)
export const TENNIS_SKILLS_DB = [
  { key: 'forehand_progress', label: 'Forehand' },
  { key: 'backhand_progress', label: 'Backhand' },
  { key: 'serve_progress', label: 'Saque' },
  { key: 'volley_progress', label: 'Voleio' },
  { key: 'slice_progress', label: 'Slice' },
  { key: 'physical_progress', label: 'Físico' },
  { key: 'tactical_progress', label: 'Tático' },
];

export const DAYS_MAP: Record<string, string> = {
  segunda: 'Seg',
  terca: 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  sabado: 'Sáb',
  domingo: 'Dom',
};

export const STUDENT_LEVELS = [
  { label: 'Iniciante', value: 'Iniciante' },
  { label: 'Intermediário', value: 'Intermediário' },
  { label: 'Avançado', value: 'Avançado' },
];

export const STUDENT_STATUSES = [
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
  { label: 'Pendente', value: 'pending' },
];

export const PAYMENT_METHODS = [
  { label: 'PIX', value: 'pix' },
  { label: 'Dinheiro', value: 'dinheiro' },
  { label: 'Transferência', value: 'transferencia' },
  { label: 'Manual', value: 'manual' },
];

export const MAX_MONTHLY_FEE = 99999;
export const MAX_EXPENSE_AMOUNT = 999999;
export const MAX_NOTES_LENGTH = 500;
