import React, { useState } from 'react';
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

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      Toast.show({ type: 'error', text1: 'Preencha email e senha' });
      return;
    }
    setIsLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
    if (error) {
      Toast.show({ type: 'error', text1: 'Erro ao fazer login', text2: error.message });
    } else {
      Toast.show({ type: 'success', text1: 'Login realizado com sucesso!' });
    }
    setIsLoading(false);
  };

  const handleSignup = async () => {
    if (!signupData.email || !signupData.password || !signupData.fullName) {
      Toast.show({ type: 'error', text1: 'Preencha todos os campos obrigatórios' });
      return;
    }
    if (signupData.password.length < 6) {
      Toast.show({ type: 'error', text1: 'A senha deve ter pelo menos 6 caracteres' });
      return;
    }
    setIsLoading(true);
    const { error } = await signUp(
      signupData.email,
      signupData.password,
      signupData.fullName,
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
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Senha *</Text>
                  <TextInput
                    style={styles.input}
                    value={signupData.password}
                    onChangeText={(v) => setSignupData({ ...signupData, password: v })}
                    placeholder="Mínimo 6 caracteres"
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
