import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Scale,
  ShieldCheck,
  Users,
  Zap,
  Mail,
} from "lucide-react";
import { supabase } from "@/api/api";

const Contact = () => {
  const [form, setForm] = useState({
    email: "",
    subject: "",
    message: "",
    website: "", // honeypot
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startedAt, setStartedAt] = useState<number>(Date.now());

  const highlights = [
    {
      icon: Zap,
      title: "Support rapide",
      value: "Réponse sous 24h",
      color: "primary",
    },
    {
      icon: Users,
      title: "Équipe dédiée",
      value: "À votre écoute",
      color: "success",
    },
    {
      icon: ShieldCheck,
      title: "Confidentialité",
      value: "Données protégées",
      color: "info",
    },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      email: "",
      subject: "",
      message: "",
      website: "",
    });
    setStartedAt(Date.now());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSubmitted(false);

    try {
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
          website: form.website,
          startedAt,
        },
      });

      if (error) {
        throw new Error(error.message || "Erreur lors de l'envoi.");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setSubmitted(true);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'envoi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-card md:bg-background overflow-hidden">
      <div className="flex items-start gap-4 mt-6 ml-4">
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white/80 dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow hover:bg-slate-50 dark:hover:bg-white/20 transition-colors text-primary font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Retour à l'accueil</span>
        </a>
      </div>

      <div className="absolute inset-0 pointer-events-none h-full">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
        <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-success/3 blur-[60px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-12">
        <div className="text-center mb-12 space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 mb-4 shadow-lg shadow-primary/10">
            <Mail className="w-10 h-10 text-primary" />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              Contactez-nous
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Une question, une suggestion ou besoin d'aide ? Remplissez le
              formulaire ci-dessous, notre équipe vous répondra rapidement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
            {highlights.map((highlight, index) => {
              const Icon = highlight.icon;

              return (
                <Card
                  key={index}
                  className="border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-md hover:shadow-lg transition-all"
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2.5 rounded-xl border",
                        highlight.color === "primary" &&
                          "bg-primary/10 border-primary/20",
                        highlight.color === "success" &&
                          "bg-success/10 border-success/20",
                        highlight.color === "info" &&
                          "bg-info/10 border-info/20"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          highlight.color === "primary" && "text-primary",
                          highlight.color === "success" && "text-success",
                          highlight.color === "info" && "text-info"
                        )}
                      />
                    </div>

                    <div className="text-left">
                      <p className="text-xs text-muted-foreground font-medium">
                        {highlight.title}
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {highlight.value}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card className="mt-6 border-primary/20 bg-card shadow-lg max-w-xl mx-auto">
          <CardContent className="p-6">
            <div className="text-center space-y-3 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20">
                <Scale className="w-6 h-6 text-primary" />
              </div>

              <h3 className="text-lg font-bold text-foreground">
                Formulaire de contact
              </h3>

              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Remplissez ce formulaire pour nous envoyer un message
                directement.
              </p>
            </div>

            {submitted ? (
              <div className="text-center text-success font-semibold py-8">
                Merci pour votre message ! Nous vous répondrons bientôt.
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-primary/20 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Votre adresse email"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Sujet
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    minLength={3}
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-primary/20 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Sujet de votre message"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    minLength={10}
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-primary/20 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                    placeholder="Votre message"
                  />
                </div>

                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Envoi en cours..." : "Envoyer"}
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contact;