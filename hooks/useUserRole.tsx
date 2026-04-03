import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';

export type UserRole = 'administrador' | 'professor' | 'aluno' | null;

const VALID_ROLES: readonly string[] = ['administrador', 'professor', 'aluno'];

const toUserRole = (value: unknown): UserRole => {
  if (typeof value === 'string' && VALID_ROLES.includes(value)) {
    return value as UserRole;
  }
  return null;
};

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        // Validate that the value from DB is one of the known roles
        setRole(toUserRole(data?.role));
      } catch {
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id]);

  return {
    role,
    isLoading,
    isAdmin: role === 'administrador',
    isProfessor: role === 'professor',
    isAluno: role === 'aluno',
  };
};
