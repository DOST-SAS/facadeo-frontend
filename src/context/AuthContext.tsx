
import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { User } from "@/types/usersTypes";
import { supabase } from "@/api/api";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    extraData?: { first_name?: string; last_name?: string; cin?: string; phone?: string }
  ) => Promise<any>;
  insertUser: (user: { id: string; email: string; display_name?: string; phone?: string; provider?: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<any>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);


  //  insert user if not exists in table
  const insertUser = async (supabaseUser: { id: string; email: string; display_name?: string; phone?: string; p_provider?: string }) => {
    console.log("insert User : ", supabaseUser)
    if (!supabaseUser) return;

    const { data: userExists } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", supabaseUser.id)
      .maybeSingle();


    if (!userExists) {
      await supabase.from("profiles").insert([
        {
          id: supabaseUser.id,
          email: supabaseUser.email,
          display_name: supabaseUser.display_name || "",
          phone: supabaseUser.phone || "",
          status: "active", // Default status
          role: "artisan", // Default role
          p_provider: "email", // Default action status
        },
      ]);
    }
  };

  //  init session & listen to auth state change
  useEffect(() => {
    let initDone = false;

    const init = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user ?? null;
        setSession(data.session ?? null);

        if (sessionUser) {
          const { data: fullUser } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", sessionUser.id)
            .maybeSingle();
          if (!fullUser) {
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            return;
          }
          setUser(fullUser || sessionUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error(err);
        setUser(null);
      } finally {
        setLoading(false);
        initDone = true;
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession ?? null);

        if (!initDone) return;

        if (newSession?.user) {
          // Fire-and-forget, don’t block state updates
          supabase
            .from("profiles")
            .select("*")
            .eq("id", newSession.user.id)
            .maybeSingle()
            .then(({ data: fullUser }) => {
              if (!fullUser && newSession.user.email) {
                insertUser({
                  id: newSession.user.id,
                  email: newSession.user.email,
                  phone: newSession.user.phone,
                });
              }
              setUser(fullUser || newSession.user);
            }, (err: unknown) => console.error(err));
        } else {
          setUser(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    extraData?: { first_name?: string; last_name?: string; phone?: string }
  ) => {
    setLoading(true);
    try {
      const { data: existingUsers, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .limit(1);

      if (checkError) throw checkError;

      if (existingUsers && existingUsers.length > 0) {
        return { error: "Cet email est déjà utilisé." };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: extraData,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return { data };

    } catch (err: any) {
      return { error: err.message ?? "Erreur inconnue" };
    } finally {
      setLoading(false);
    }
  };



  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) return { error: authError.message };

      let { data: fullUser, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError) return { error: profileError.message };

      // If profile doesn't exist, try to create it immediately
      if (!fullUser) {
        await insertUser({
          id: authData.user.id,
          email: authData.user.email!,
          phone: authData.user.phone
        });

        // Refetch after insertion
        const { data: newUser } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        fullUser = newUser;
      }
      if (fullUser && (fullUser.status === "suspended" || fullUser.status === "inactive")) {
        await supabase.auth.signOut();
        return { error: "compte suspendu" };
      }



      setUser(fullUser || authData.user);
      setSession(authData.session ?? null);

      return { data: fullUser };
    } catch (err: any) {
      return { error: err.message ?? "Erreur inconnue" };
    } finally {
      setLoading(false);
    }
  };


  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) return { error };
      return { data };

    } catch (err) {
      return { error: err };

    } finally {
      setLoading(false);
    }
  };


 const signOut = async () => {
  setLoading(true);
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setUser(null);
    setSession(null);

    // optional: force clear localStorage key of Supabase session
    localStorage.removeItem("sb:token");

    // redirect بعد ما كلشي يصفى
    window.location.href = "/";
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    setLoading(false);
  }
};



  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Utilisateur non authentifié" };
      }

      const isEmailProvider =
        user.app_metadata?.provider === "email" ||
        user.identities?.some((i) => i.provider === "email");

      if (!isEmailProvider) {
        return {
          error:
            "Impossible de changer le mot de passe pour un compte Google",
        };
      }

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: user.email!,
          password: currentPassword,
        });

      if (signInError) {
        return { error: "Mot de passe actuel incorrect" };
      }
      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        return { error: updateError.message };
      }

      return { success: true };
    } catch (err: any) {
      return { error: err.message ?? "Erreur inconnue" };
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: fullUser } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (fullUser) {
        setUser(fullUser);
      }
    } catch (err) {
      console.error("Error refreshing user:", err);
    }
  }, [user?.id]);

  const value = React.useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    insertUser,
    signIn,
    signInWithGoogle,
    signOut,
    changePassword,
    refreshUser,
  }), [user, session, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};