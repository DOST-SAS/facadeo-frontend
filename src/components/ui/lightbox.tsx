import { Button } from "./button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./dialog"

interface LightboxProps {
    isOpen: boolean
    imageUrl: string
    onConfirm: () => void
    onDecline: () => void
    isLoading?: boolean
}

export function Lightbox({ isOpen, imageUrl, onConfirm, onDecline, isLoading }: LightboxProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onDecline()}>
            <DialogContent className="max-w-3xl! p-0 overflow-hidden border-none bg-transparent shadow-none">
                <DialogHeader className="sr-only">
                    <DialogTitle>Aperçu de la capture</DialogTitle>
                </DialogHeader>

                <div className="relative group">
                    <div className="bg-white rounded-sm overflow-hidden shadow-2xl border border-border/50">
                        <img
                            src={imageUrl}
                            alt="Captured facade"
                            className="w-full h-auto max-h-[85vh] object-contain"
                        />

                        <div className="p-4 bg-card border-t border-border/50">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="space-y-1 text-center sm:text-left">
                                    <p className="text-base font-bold text-foreground">
                                        Enregistrer la capture ?
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Cette image sera utilisée comme référence pour la façade.
                                    </p>
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        onClick={onDecline}
                                        disabled={isLoading}
                                        className="flex-1 sm:flex-none min-w-[100px] border-border/60"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={onConfirm}
                                        disabled={isLoading}
                                        className="flex-1 sm:flex-none min-w-[120px] bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                                                <span>Envoi...</span>
                                            </div>
                                        ) : (
                                            'Confirmer'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
