import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import Toast from 'react-native-toast-message';
import { Colors } from '@/constants/colors';
import { CustomPicker } from '@/components/CustomPicker';

type Tab = 'login' | 'signup';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const formatDocumento = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    return numbers
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
};

const isValidCPF = (cpf: string): boolean => {
  const n = cpf.replace(/\D/g, '');
  if (n.length !== 11 || /^(\d)\1+$/.test(n)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(n[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (check !== parseInt(n[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(n[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return check === parseInt(n[10]);
};

const isValidCNPJ = (cnpj: string): boolean => {
  const n = cnpj.replace(/\D/g, '');
  if (n.length !== 14 || /^(\d)\1+$/.test(n)) return false;
  const calc = (digits: string, weights: number[]) =>
    digits.split('').reduce((sum, d, i) => sum + parseInt(d) * weights[i], 0);
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const r1 = calc(n.slice(0, 12), w1) % 11;
  const d1 = r1 < 2 ? 0 : 11 - r1;
  if (d1 !== parseInt(n[12])) return false;
  const r2 = calc(n.slice(0, 13), w2) % 11;
  const d2 = r2 < 2 ? 0 : 11 - r2;
  return d2 === parseInt(n[13]);
};

const isValidDocumento = (doc: string): boolean => {
  const digits = doc.replace(/\D/g, '');
  if (digits.length === 11) return isValidCPF(digits);
  if (digits.length === 14) return isValidCNPJ(digits);
  return digits.length === 0; // empty is ok (optional field)
};

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000; // 1 minute

// ─── Component ────────────────────────────────────────────────────────────────
export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [isLoading, setIsLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    fullName: '',
    documento: '',
    role: 'professor',
  });

  // Client-side rate limiting state
  const loginAttempts = useRef(0);
  const lastAttemptAt = useRef<number | null>(null);

  const handleLogin = async () => {
    // Rate limiting check
    const now = Date.now();
    if (
      loginAttempts.current >= MAX_ATTEMPTS &&
      lastAttemptAt.current !== null &&
      now - lastAttemptAt.current < LOCKOUT_MS
    ) {
      const remaining = Math.ceil((LOCKOUT_MS - (now - lastAttemptAt.current)) / 1000);
      Toast.show({
        type: 'error',
        text1: 'Muitas tentativas',
        text2: `Aguarde ${remaining}s antes de tentar novamente`,
      });
      return;
    }

    if (!loginData.email || !loginData.password) {
      Toast.show({ type: 'error', text1: 'Preencha email e senha' });
      return;
    }

    if (!EMAIL_REGEX.test(loginData.email.trim())) {
      Toast.show({ type: 'error', text1: 'Informe um email válido' });
      return;
    }

    setIsLoading(true);
    loginAttempts.current += 1;
    lastAttemptAt.current = Date.now();

    const { error } = await signIn(loginData.email.trim(), loginData.password);
    if (error) {
      Toast.show({ type: 'error', text1: 'Email ou senha incorretos' });
    } else {
      loginAttempts.current = 0; // reset on success
    }
    setIsLoading(false);
  };

  const handleSignup = async () => {
    const trimmedEmail = signupData.email.trim();
    const trimmedName = signupData.fullName.trim();

    if (!trimmedEmail || !signupData.password || !trimmedName) {
      Toast.show({ type: 'error', text1: 'Preencha todos os campos obrigatórios' });
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      Toast.show({ type: 'error', text1: 'Informe um email válido' });
      return;
    }

    if (signupData.password.length < 12) {
      Toast.show({ type: 'error', text1: 'A senha deve ter pelo menos 12 caracteres' });
      return;
    }

    if (signupData.documento && !isValidDocumento(signupData.documento)) {
      Toast.show({ type: 'error', text1: 'CPF ou CNPJ inválido' });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(
      trimmedEmail,
      signupData.password,
      trimmedName,
      signupData.documento,
      signupData.role
    );
    if (error) {
      Toast.show({ type: 'error', text1: 'Erro ao criar conta', text2: error.message });
    } else {
      Toast.show({ type: 'success', text1: 'Conta criada com sucesso!' });
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="cover"
            />
            <Text style={styles.appName}>RacketPro</Text>
            <Text style={styles.appSubtitle}>Gestão de alunos de tênis</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
                onPress={() => setTab('login')}
              >
                <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, tab === 'signup' && styles.tabBtnActive]}
                onPress={() => setTab('signup')}
              >
                <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
                  Cadastro
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Form */}
            {tab === 'login' && (
              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={loginData.email}
                    onChangeText={(v) => setLoginData({ ...loginData, email: v })}
                    placeholder="seu@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Senha</Text>
                  <TextInput
                    style={styles.input}
                    value={loginData.password}
                    onChangeText={(v) => setLoginData({ ...loginData, password: v })}
                    placeholder="••••••••"
                    secureTextEntry
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <Text style={styles.submitText}>{isLoading ? 'Entrando...' : 'Entrar'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Signup Form */}
            {tab === 'signup' && (
              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.label}>Nome Completo *</Text>
                  <TextInput
                    style={styles.input}
                    value={signupData.fullName}
                    onChangeText={(v) => setSignupData({ ...signupData, fullName: v })}
                    placeholder="Seu nome"
                    placeholderTextColor={Colors.textMuted}
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>CPF/CNPJ</Text>
                  <TextInput
                    style={styles.input}
                    value={signupData.documento}
                    onChangeText={(v) =>
                      setSignupData({ ...signupData, documento: formatDocumento(v) })
                    }
                    placeholder="000.000.000-00"
                    keyboardType="numeric"
                    maxLength={18}
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={styles.field}>
                  <CustomPicker
                    label="Tipo de Usuário"
                    value={signupData.role}
                    onValueChange={(v) => setSignupData({ ...signupData, role: v })}
                    options={[
                      { label: 'Professor', value: 'professor' },
                      { label: 'Aluno', value: 'aluno' },
                    ]}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Email *</Text>
                  <TextInput
                    style={styles.input}
                    value={signupData.email}
                    onChangeText={(v) => setSignupData({ ...signupData, email: v })}
                    placeholder="seu@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Senha *</Text>
                  <TextInput
                    style={styles.input}
                    value={signupData.password}
                    onChangeText={(v) => setSignupData({ ...signupData, password: v })}
                    placeholder="Mínimo 12 caracteres"
                    secureTextEntry
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
                  onPress={handleSignup}
                  disabled={isLoading}
                >
                  <Text style={styles.submitText}>
                    {isLoading ? 'Criando conta...' : 'Criar Conta'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryBg },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  appName: { fontSize: 28, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5 },
  appSubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.muted,
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: '500', color: Colors.textMuted },
  tabTextActive: { color: Colors.text, fontWeight: '700' },
  form: { gap: 2 },
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
