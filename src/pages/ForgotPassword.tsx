import { useState } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"
import { supabase } from "@/api/api"
import toast from "react-hot-toast"

const forgotPasswordSchema = z.object({
    email: z.string().email("Veuillez entrer une adresse e-mail valide"),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

const ForgotPassword = () => {
    const [loading, setLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const form = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    })

    const onSubmit = async (data: ForgotPasswordValues) => {
        if (!data.email) {
            toast.error("Veuillez entrer une adresse e-mail valide")
            return
        }
        setLoading(true)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (error) {
                const msg = error.message.toLowerCase()
                if (msg.includes('too many requests')) {
                    toast.error("Trop de tentatives. Veuillez patienter avant de réessayer.")
                } else if (msg.includes('user not found')) {
                    toast.error("Aucun compte n'est associé à cette adresse e-mail.")
                } else {
                    toast.error("Impossible d'envoyer l'e-mail de réinitialisation.")
                }
                return
            }

            setIsSubmitted(true)
            toast.success("E-mail de réinitialisation envoyé !")
        } catch (error: any) {
            console.error("Reset password failed:", error)
            toast.error("Une erreur est survenue. Veuillez réessayer.")
        } finally {
            setLoading(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-linear-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="w-full max-w-md space-y-8 relative z-10 text-center">
                    <div className="bg-card/50 backdrop-blur-xl border border-border/50 p-10 rounded-3xl shadow-2xl space-y-6">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-foreground">Vérifiez votre boîte mail</h1>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Nous avons envoyé un lien de réinitialisation à <br />
                                <span className="font-semibold text-foreground">{form.getValues("email")}</span>
                            </p>
                        </div>
                        <div className="pt-4">
                            <Link to="/login">
                                <Button variant="outline" className="w-full h-12 rounded-xl group">
                                    <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                    Retour à la connexion
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Illustration (Matching Register/Login) */}
            <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary/5 via-background to-accent/5 items-center justify-center p-12 relative overflow-hidden border-r border-border/30">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 rounded-full bg-accent/10 blur-3xl" />

                <div className="relative z-10 flex flex-col items-center justify-center space-y-8 max-w-lg">
                    <div className="w-full aspect-square rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
                        <img
                            src="/login_illustration.png"
                            alt="Construction Tool Illustration"
                            className="w-full h-full object-cover rounded-2xl"
                        />
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
                <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                    <div className="space-y-6">
                        <Link to="/login" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors group">
                            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Retour
                        </Link>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mot de passe oublié ?</h1>
                            <p className="text-muted-foreground font-medium">
                                Pas de panique ! Entrez votre e-mail pour recevoir un lien de réinitialisation.
                            </p>
                        </div>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="votre@email.com"
                                                    className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl focus:ring-primary/20 focus:border-primary transition-all text-base"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage className="ml-2 font-medium" />
                                    </FormItem>
                                )}
                            />

                            <Button
                                disabled={loading}
                                type="submit"
                                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/25 transition-all active:scale-[0.98] group"
                            >
                                {loading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Envoyer le lien
                                        <ArrowLeft className="h-5 w-5 rotate-180 transition-transform group-hover:translate-x-1" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    </Form>

                    <p className="text-center text-sm font-medium text-slate-500">
                        Vous vous en souvenez ?{" "}
                        <Link to="/" className="text-primary font-bold hover:underline underline-offset-4">
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword
