import Toast from 'react-native-toast-message';

/**
 * Centralized error handler.
 * - In __DEV__: logs full error to console.
 * - In production: shows only a safe user-facing message (never raw stack traces).
 */
export const handleError = (
  err: unknown,
  title = 'Ocorreu um erro inesperado'
): void => {
  if (__DEV__) {
    console.error('[handleError]', err);
  }

  const isSupabaseAuthError =
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    (err as any).status === 400;

  // Translate common Supabase auth errors to Portuguese
  let subtitle: string | undefined;
  if (isSupabaseAuthError) {
    const msg = (err as any).message ?? '';
    if (msg.includes('Invalid login credentials')) {
      subtitle = 'Email ou senha incorretos';
    } else if (msg.includes('Email not confirmed')) {
      subtitle = 'Confirme seu email antes de entrar';
    } else if (msg.includes('User already registered')) {
      subtitle = 'Este email já está cadastrado';
    }
  }

  Toast.show({
    type: 'error',
    text1: title,
    text2: subtitle,
  });
};

export const handleSuccess = (message: string): void => {
  Toast.show({ type: 'success', text1: message });
};
