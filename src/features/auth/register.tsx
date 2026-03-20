import { useState } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { User, Mail, Lock, Eye, EyeOff, Loader, Phone } from "lucide-react"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import { registerSchema } from "@/utils/validators"
import { useAuth } from "@/context/AuthContext"

type RegisterFormValues = z.infer<typeof registerSchema>

const Register = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState("")

    const { signUp } = useAuth()

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
            acceptTerms: false,
        },
    })

    const handleRegister = async (data: RegisterFormValues) => {
        try {
            setLoading(true)
            setSuccessMessage("")

            const result = await signUp(data.email, data.password, {
                first_name: data.firstName,
                last_name: data.lastName,
                phone: data.phone
            })

            if (result?.error) {
                form.setError("root", { message: result.error })
                return
            }

            setSuccessMessage(
                "Un email de confirmation vous a été envoyé. Vérifiez votre boîte mail pour activer votre compte."
            )
            form.reset()
        } catch (error: any) {
            console.error("Registration failed:", error)
            form.setError("root", {
                message: error.message || "Erreur lors de l'inscription"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-background text-foreground">
            <div className="hidden lg:flex lg:w-1/3 bg-linear-to-br from-primary/5 via-background to-accent/5 items-center justify-center p-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 rounded-full bg-accent/10 blur-3xl" />

                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                    <div className="w-full h-full rounded-sm overflow-hidden shadow-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
                        <img
                            src="/login_illustration.png"
                            alt="Modern construction management illustration"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
                <div className="w-2/3 space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-foreground">Créez votre compte</h1>
                        <p className="text-sm text-muted-foreground">
                            Renseignez vos informations pour commencer.
                        </p>
                    </div>

                    {successMessage && (
                        <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/10 rounded-md">
                            {successMessage}
                        </div>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
                            {form.formState.errors.root && (
                                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-md">
                                    {form.formState.errors.root.message}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <FormControl>
                                                    <Input
                                                        placeholder="Nom"
                                                        className="pl-10 h-12 bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <FormControl>
                                                    <Input
                                                        placeholder="Prénom"
                                                        className="pl-10 h-12 bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex gap-2">
                                <div className="grow">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            placeholder="Adresse e-mail"
                                                            className="pl-10 h-12 bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grow">
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <div className="relative">
                                                    <div className="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/10 border-r border-slate-200 dark:border-white/10 rounded-l-md z-10 pointer-events-none">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium text-muted-foreground">+33</span>
                                                    </div>
                                                    <FormControl>
                                                        <Input
                                                            type="tel"
                                                            placeholder="6 12 34 56 78"
                                                            className="pl-24 h-12 bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10"
                                                            {...field}
                                                            value={field.value?.startsWith("+33") ? field.value.slice(3) : field.value}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/^0/, "")
                                                                field.onChange(val ? `+33${val}` : "")
                                                            }}
                                                        />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <FormControl>
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Mot de passe"
                                                    className="pl-10 pr-10 h-12 bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <FormControl>
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Confirmer mot de passe"
                                                    className="pl-10 pr-10 h-12 bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="acceptTerms"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col space-x-2 space-y-0">
                                        <div className="flex items-center gap-2">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel className="text-sm text-muted-foreground cursor-pointer font-normal">
                                                J'accepte les
                                                <Link to="/terms" className="text-primary underline text-xs hover:underline"> Conditions d'utilisation</Link>
                                                et
                                                <Link to="/privacy" className="text-primary underline text-xs hover:underline"> Politique de confidentialité.</Link>
                                            </FormLabel>
                                        </div>
                                        <FormMessage className="ml-0! block" />
                                    </FormItem>
                                )}
                            />

                            <Button
                                disabled={loading}
                                variant="default"
                                type="submit"
                                className="w-full h-12 font-semibold text-base"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        Création du compte...
                                    </>
                                ) : (
                                    "Créer un compte"
                                )}
                            </Button>
                        </form>
                    </Form>

                    <div className="text-center text-sm text-muted-foreground">
                        Vous avez déjà un compte ?{" "}
                        <Link to="/" className="text-primary font-semibold hover:underline">
                            Connectez-vous
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register