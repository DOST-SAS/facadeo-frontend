import { useState, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, CheckCircle, Loader } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/api/api"
import { cn } from "@/lib/utils"

const EmailVerification = () => {
    const [otp, setOtp] = useState<string[]>(new Array(8).fill(""))
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const [isVerifying, setIsVerifying] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const location = useLocation()
    const { user, insertUser } = useAuth()

    const email = location.state?.email || user?.email

    const handleChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return

        const newOtp = [...otp]
        // Allow replacing existing value with single digit
        newOtp[index] = value.substring(value.length - 1)
        setOtp(newOtp)

        // Focus next input
        if (value && index < 7) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 8).split("")
        if (pastedData.length > 0) {
            const newOtp = [...otp]
            pastedData.forEach((val, i) => {
                newOtp[i] = val
            })
            setOtp(newOtp)
            inputRefs.current[Math.min(pastedData.length - 1, 7)]?.focus()
        }
    }

    const handleVerify = async () => {
        const token = otp.join("")
        if (token.length < 8) return
        setIsVerifying(true)
        setMessage(null)

        try {
            if (!email) throw new Error("Email manquant")

            const { data, error } = await supabase.auth.verifyOtp({
                email: email,
                token: token,
                type: 'signup',
            })

            if (error) throw error

            if (data.user) {
                console.log("user : ", data.user)
                await insertUser({
                    id: data.user.id,
                    email: data.user.email!,
                    display_name: location.state?.name,
                    phone: location.state?.phone,
                    provider: "email",
                })

                // Fetch user profile to get role
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", data.user.id)
                    .single()

                setMessage({ type: 'success', text: 'Votre compte est vérifié ! Redirection...' })

                // Redirect based on user role after successful verification
                // The session is already created by verifyOtp, so user is logged in
                setTimeout(() => {
                    if (profile?.role === 'admin') {
                        window.location.href = "/admin"
                    } else {
                        window.location.href = "/artisan"
                    }
                }, 1500)
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Code invalide' })
        } finally {
            setIsVerifying(false)
        }
    }

    const handleResendEmail = async () => {
        setIsResending(true)
        setMessage(null)

        try {
            if (!email) throw new Error("Email manquant")

            const { error } = await supabase.auth.resend({
                type: "signup",
                email: email,
            })

            if (error) throw error

            setMessage({ type: 'success', text: "Code renvoyé avec succès" })
            setTimeout(() => setMessage(null), 3000)
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-50 relative overflow-hidden transition-colors duration-300">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/20 blur-[120px] rounded-full opacity-50 dark:opacity-20 animate-blob" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/10 blur-[100px] rounded-full opacity-40 dark:opacity-20 animate-blob animation-delay-2000" />
            </div>

            <div className="w-full h-full flex items-center justify-center p-3 relative z-10">
                <div className="max-w-lg w-full bg-white/40 dark:bg-[#020617]/40 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 lg:p-12 text-center border border-slate-200 dark:border-white/5 space-y-8 animate-in fade-in zoom-in-95 duration-700">


                    <div className="space-y-3">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Vérifiez votre compte
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            Un code de vérification a été envoyé à
                            <span className="text-primary font-bold mx-1 block">{email}</span>
                            Saisissez les 8 chiffres pour activer votre compte.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-center gap-2 sm:gap-1">
                            {otp.map((digit, index) => (
                                <Input
                                    key={index}
                                    type="text"
                                    maxLength={1}
                                    className={cn(
                                        "w-12 sm:w-20! h-16 text-center text-2xl! font-bold rounded-2xl bg-slate-50/50 dark:bg-white/5 border-2 transition-all p-0",
                                        digit ? "border-primary shadow-lg shadow-primary/10" : "border-slate-200 dark:border-white/10",
                                        message && message.type === 'success' ? 'border-emerald-500 bg-emerald-500/5' : '',
                                        message && message.type === 'error' ? 'border-red-500 bg-red-500/5 anim-shake' : '',
                                    )}
                                    value={digit}
                                    ref={(el) => { inputRefs.current[index] = el }}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                />
                            ))}
                        </div>

                        {message && (
                            <div className={cn(
                                "flex items-center justify-center gap-2 text-sm font-bold p-4 rounded-2xl border animate-in slide-in-from-top-2 duration-300",
                                message.type === 'success'
                                    ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
                                    : 'text-red-600 bg-red-500/10 border-red-500/20'
                            )}>
                                {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : null}
                                <span>{message.text}</span>
                            </div>
                        )}

                        <Button
                            onClick={handleVerify}
                            disabled={isVerifying || otp.join("").length < 6}
                            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                        >
                            {isVerifying ? (
                                <div className="flex items-center gap-2">
                                    <Loader className="h-6 w-6 animate-spin" />
                                    <span>Vérification...</span>
                                </div>
                            ) : (
                                "Confirmer le code"
                            )}
                        </Button>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Pas reçu de code ?
                        </p>
                        <Button
                            variant="ghost"
                            onClick={handleResendEmail}
                            disabled={isResending}
                            className="text-primary font-bold hover:text-primary/80 hover:bg-primary/5 rounded-xl transition-all h-auto py-2"
                        >
                            {isResending ? (
                                <div className="flex items-center gap-2">
                                    <Loader className="h-4 w-4 animate-spin" />
                                    <span>Renvoi en cours...</span>
                                </div>
                            ) : (
                                "Renvoyer le code"
                            )}
                        </Button>
                    </div>

                    <div className="pt-2">
                        <Link
                            to="/login"
                            className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors hover:underline underline-offset-4"
                        >
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EmailVerification
