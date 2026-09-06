import { createContext, useContext, useEffect, useState } from "react";
import { authApi, getCurrentAccessToken } from "@/services/api";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuthState = () => {
    localStorage.removeItem("access_token");
    setSession(null);
    setProfile(null);
  };

  const fetchMe = async (token) => {
    try {
      const data = await authApi.me(token);

      if (!data?.user) {
        return null;
      }

      return data.user;
    } catch (error) {
      console.error("FETCH ME ERROR:", error);
      return null;
    }
  };

  const syncAuthState = async () => {
    try {
      const token = await getCurrentAccessToken();

      if (!token) {
        clearAuthState();
        setLoading(false);
        return;
      }

      const user = await fetchMe(token);

      if (user) {
        setSession({ access_token: token, user });
        setProfile(user);
      } else {
        clearAuthState();
      }
    } catch (error) {
      console.error("AUTH INITIALIZATION ERROR:", error);
      clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncAuthState();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      console.info("SUPABASE AUTH EVENT:", event);

      if (event === "SIGNED_OUT") {
        clearAuthState();
        return;
      }

      if (nextSession?.access_token) {
        localStorage.setItem("access_token", nextSession.access_token);

        const user = await fetchMe(nextSession.access_token);

        if (user) {
          setSession({ access_token: nextSession.access_token, user });
          setProfile(user);
        } else {
          clearAuthState();
        }
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      const data = await authApi.login({
        email: email.trim(),
        password,
      });

      const token = data?.access_token || data?.token || data?.session?.access_token;

      if (!token) {
        console.error("LOGIN RESPONSE:", data);
        return {
          error: "Access token not received from backend",
        };
      }

      if (data?.session) {
        try {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        } catch (sessionError) {
          console.error("SESSION SET ERROR:", sessionError);
        }
      }

      localStorage.setItem("access_token", token);

      const user = await fetchMe(token);

      if (!user) {
        clearAuthState();
        return {
          error: "Unable to fetch authenticated user",
        };
      }

      setSession({ access_token: token, user });
      setProfile(user);

      return {
        error: null,
        user,
      };
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      return {
        error: error?.message || "Unable to connect to backend",
      };
    }
  };

  const signUp = async (
    email,
    password,
    fullName,
    phone = "",
    department = ""
  ) => {
    try {
      const data = await authApi.register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        phone: phone || null,
        department: department || null,
      });

      return {
        error: null,
        user: data.user,
      };
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      return {
        error: error?.message || "Unable to connect to backend",
      };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("SUPABASE SIGNOUT ERROR:", error);
    }

    clearAuthState();
  };

  const refreshProfile = async () => {
    const token = await getCurrentAccessToken();

    if (!token) {
      clearAuthState();
      return;
    }

    const user = await fetchMe(token);

    if (user) {
      setSession({ access_token: token, user });
      setProfile(user);
    } else {
      clearAuthState();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}