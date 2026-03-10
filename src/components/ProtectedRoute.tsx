
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import LoaderSpin from "./Loader"

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredRole?: 'admin' | 'artisan'
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoaderSpin/>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/" state={{ from: location }} replace />
    }

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}