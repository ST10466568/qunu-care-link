import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  user_type: 'patient' | 'staff';
}

interface Patient {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  patient_number?: string;
}

interface Staff {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  role: 'doctor' | 'nurse' | 'admin';
  phone?: string;
  staff_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  patient: Patient | null;
  staff: Staff | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: { first_name: string; last_name: string; phone: string; user_type: 'patient' | 'staff'; role?: 'doctor' | 'nurse' | 'admin' }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getAuthToken = () => localStorage.getItem('auth_token');
  const setAuthToken = (token: string) => localStorage.setItem('auth_token', token);
  const removeAuthToken = () => localStorage.removeItem('auth_token');

  const fetchUserProfile = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          removeAuthToken();
          setUser(null);
          setPatient(null);
          setStaff(null);
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setUser(data.user);
      setPatient(data.patient || null);
      setStaff(data.staff || null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      removeAuthToken();
      setUser(null);
      setPatient(null);
      setStaff(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const signUp = async (email: string, password: string, userData: { first_name: string; last_name: string; phone: string; user_type: 'patient' | 'staff'; role?: 'doctor' | 'nurse' | 'admin' }) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          ...userData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Sign Up Error",
          description: data.error || 'Failed to sign up',
          variant: "destructive",
        });
        return { error: data.error };
      }

      // Store the token and update state
      setAuthToken(data.token);
      setUser(data.user);
      setPatient(data.patient || null);
      setStaff(data.staff || null);

      toast({
        title: "Account created successfully",
        description: "Welcome to Hopewell Clinic!",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign Up Error",
        description: error.message || 'Failed to sign up',
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Sign In Error",
          description: data.error || 'Failed to sign in',
          variant: "destructive",
        });
        return { error: data.error };
      }

      // Store the token and update state
      setAuthToken(data.token);
      setUser(data.user);
      setPatient(data.patient || null);
      setStaff(data.staff || null);

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign In Error",
        description: error.message || 'Failed to sign in',
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });

      removeAuthToken();
      setUser(null);
      setPatient(null);
      setStaff(null);
      
      toast({
        title: "Signed out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Sign Out Error",
        description: error.message || 'Failed to sign out',
        variant: "destructive",
      });
    }
  };

  const value: AuthContextType = {
    user,
    patient,
    staff,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};