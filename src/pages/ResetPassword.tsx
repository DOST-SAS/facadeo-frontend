import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"
import { supabase } from "@/api/api"
import toast from "react-hot-toast"

const resetPasswordSchema = z.object({
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
})

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

const ResetPassword = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const form = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    })

    const onSubmit = async (data: ResetPasswordValues) => {
        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password,
            })

            if (error) {
                const msg = error.message.toLowerCase()
                if (msg.includes('same as old password')) {
                    toast.error("Le nouveau mot de passe doit être différent de l'ancien.")
                } else if (msg.includes('token has expired') || msg.includes('invalid link')) {
                    toast.error("Le lien de réinitialisation a expiré ou est invalide. Veuillez recommencer la procédure.")
                } else {
                    toast.error("Erreur lors de la mise à jour du mot de passe.")
                }
                return
            }

            toast.success("Mot de passe mis à jour avec succès !")
            navigate("/login")
        } catch (error: any) {
            console.error("Password update failed:", error)
            toast.error("Une erreur est survenue lors de la mise à jour.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-linear-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-primary/10 blur-3xl opacity-50" />
            <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 rounded-full bg-accent/10 blur-3xl opacity-50" />

            <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 p-10 rounded-3xl shadow-2xl space-y-8">
                    <div className="text-center space-y-3">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 rotate-3">
                                <ShieldCheck className="h-8 w-8 text-primary -rotate-3" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nouveau mot de passe</h1>
                        <p className="text-sm font-medium text-slate-500 max-w-[280px] mx-auto">
                            Choisissez un mot de passe fort pour sécuriser votre accès.
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                            <FormControl>
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Nouveau mot de passe"
                                                    className="pl-12 pr-12 h-14 bg-slate-50 border-slate-200 rounded-2xl focus:ring-primary/20 focus:border-primary transition-all text-base"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        <FormMessage className="ml-2 font-medium" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                            <FormControl>
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Confirmez le mot de passe"
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
                                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg shadow-xl transition-all active:scale-[0.98]"
                            >
                                {loading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    "Réinitialiser le mot de passe"
                                )}
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    )
}

export default ResetPassword
