import { useEffect } from "react";
import { supabase } from "@/api/api";
import LoaderSpin from "@/components/Loader";

export default function AuthCallback() {
  useEffect(() => {
    let subscription: any;

    const finalizeLogin = async () => {
      try {
        let session = null;

        const { data } = await supabase.auth.getSession();
        session = data.session;

        if (!session) {
          await new Promise<void>((resolve) => {
            const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
              if (newSession) {
                session = newSession;
                resolve();
              }
            });
            subscription = data.subscription;
          });
        }

        if (!session) {
          console.error("No session received from OAuth");
          return;
        }

        const userId = session.user.id;
        const userName =
          session.user.user_metadata?.full_name ||
          session.user.email ||
          "Utilisateur";

        const userAvatar = session.user.user_metadata?.avatar_url || null;
        const provider = session.user.app_metadata?.provider || "unknown";

        const { data: exists } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (!exists) {
          await supabase.from("profiles").insert({
            id: userId,
            email: session.user.email,
            display_name: userName,
            avatar: userAvatar,
            p_provider: provider,
          });
        } else {
          await supabase
            .from("profiles")
            .update({
              display_name: userName,
              avatar: userAvatar,
              p_provider: provider,
            })
            .eq("id", userId);
        }

        window.location.replace("/artisan");

      } catch (err) {
        console.error("Callback error:", err);
      }
    };

    finalizeLogin();

    return () => {
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, []);

  return <LoaderSpin />;
}
