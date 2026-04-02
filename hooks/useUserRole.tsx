import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';

export type UserRole = 'administrador' | 'professor' | 'aluno' | null;

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
        setRole(data?.role as UserRole);
      } catch {
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return {
    role,
    isLoading,
    isAdmin: role === 'administrador',
    isProfessor: role === 'professor',
    isAluno: role === 'aluno',
  };
};
