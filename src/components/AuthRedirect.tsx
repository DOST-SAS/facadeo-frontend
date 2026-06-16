
import { Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import LoaderSpin from "./Loader"

interface AuthRedirectProps {
    children: React.ReactNode
}

export const AuthRedirect = ({ children }: AuthRedirectProps) => {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoaderSpin/>
            </div>
        )
    }

    // If user is authenticated, redirect to appropriate dashboard
    if (user) {
        if (user.role === 'admin') {
            return <Navigate to="/admin" replace />
        } else {
            return <Navigate to="/" replace />
        }
    }

    return <>{children}</>
}