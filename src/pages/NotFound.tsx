import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Undo2 } from "lucide-react"

const NotFound = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
            <div className="max-w-4xl w-full rounded-2xl p-10 text-center space-y-8">
                {/* Disconnected Plug Illustration */}
                <div className="flex justify-center">
                    <svg
                        className="w-64 h-32"
                        viewBox="0 0 400 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Left Cable */}
                        <path
                            d="M10 50 Q80 30, 150 50"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            className="text-foreground"
                        />

                        {/* Left Plug */}
                        <g className="text-foreground">
                            <rect x="150" y="35" width="25" height="30" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
                            <line x1="157" y1="40" x2="157" y2="60" stroke="currentColor" strokeWidth="2" />
                            <line x1="163" y1="40" x2="163" y2="60" stroke="currentColor" strokeWidth="2" />
                            <line x1="169" y1="40" x2="169" y2="60" stroke="currentColor" strokeWidth="2" />
                        </g>

                        {/* Right Plug */}
                        <g className="text-foreground">
                            <rect x="225" y="35" width="25" height="30" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
                            <line x1="232" y1="40" x2="232" y2="60" stroke="currentColor" strokeWidth="2" />
                            <line x1="238" y1="40" x2="238" y2="60" stroke="currentColor" strokeWidth="2" />
                            <line x1="244" y1="40" x2="244" y2="60" stroke="currentColor" strokeWidth="2" />
                        </g>

                        {/* Right Cable */}
                        <path
                            d="M250 50 Q320 70, 390 50"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            className="text-foreground"
                        />

                        {/* Spark Lines */}
                        <line x1="190" y1="25" x2="200" y2="15" stroke="currentColor" strokeWidth="2" className="text-foreground" />
                        <line x1="200" y1="25" x2="210" y2="15" stroke="currentColor" strokeWidth="2" className="text-foreground" />
                        <line x1="190" y1="75" x2="200" y2="85" stroke="currentColor" strokeWidth="2" className="text-foreground" />
                        <line x1="200" y1="75" x2="210" y2="85" stroke="currentColor" strokeWidth="2" className="text-foreground" />
                    </svg>
                </div>

                {/* 404 Text */}
                <div className="space-y-4">
                    <h1 className="text-8xl font-bold text-foreground">404</h1>
                    <h2 className="text-2xl font-semibold text-foreground">
                     Oups ! Page introuvable
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                        La page que vous recherchez n'existe pas ou a été déplacée.
                        Vérifiez l'URL ou retournez à la page d'accueil pour continuer votre navigation.
                    </p>
                </div>

                {/* Go Back Home Button */}
                <div className="pt-4">
                    <Link to="/">
                        <Button
                            variant="default"
                            size="lg"
                            className="h-12 px-8 font-semibold rounded-full "
                        >
                            <Undo2 className=" h-5 w-5" />
                            Retour à la page d'accueil
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default NotFound