import { clsx, type ClassValue } from "clsx"
import { CheckCircle2, FileText, Loader, PauseCircle, Send, XCircle, Shield, ShieldAlert, ShieldCheck, Users, ScanLine, Building2, Euro, AlertCircle, TrendingUp, Eye } from "lucide-react"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}


export const statusBadgeConfig: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
    draft: {
        label: "Brouillon",
        className: "bg-warning/10 text-warning border-warning/30",
        icon: FileText
    },
    ready: {
        label: "Prêt à envoyer",
        className: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 border-teal-500/30",
        icon: CheckCircle2
    },
    sent: {
        label: "Envoyé",
        className: "bg-primary/10 text-primary border-primary/30",
        icon: Send
    },
    accepted: {
        label: "Accepté",
        className: "bg-success/10 text-success border-success/30",
        icon: CheckCircle2
    },
    rejected: {
        label: "Refusé",
        className: "bg-destructive/10 text-destructive border-destructive/30",
        icon: XCircle
    },
    refused: {
        label: "Refusé",
        className: "bg-destructive/10 text-destructive border-destructive/30",
        icon: XCircle
    },
    expired: {
        label: "Expiré",
        className: "bg-secondary/60 text-secondary-foreground border-2 border-secondary",
        icon: AlertCircle
    },
    viewed: {
        label: "En discussion",
        className: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-orange-500/30",
        icon: Eye
    },
    completed: {
        label: "Completé",
        className: "bg-success/10 text-success border-success/30",
        icon: CheckCircle2
    },
    inprogress: {
        label: "En cours",
        className: "bg-warning/10 text-warning border-warning/30",
        icon: Loader
    },
    running: {
        label: "En cours",
        className: "bg-warning/10 text-warning border-warning/30",
        icon: Loader
    },
    pending: {
        label: "En cours",
        className: "bg-warning/10 text-warning border-warning/30",
        icon: Loader
    },
    paused: {
        label: "Pause",
        className: "bg-secondary/60 text-secondary-foreground border-secondary",
        icon: PauseCircle
    },
    canceled: {
        label: "Annulé",
        className: "bg-destructive/10 text-destructive border-destructive/30",
        icon: XCircle
    },
    failed: {
        label: "Échoué",
        className: "bg-destructive/10 text-destructive border-destructive/30",
        icon: AlertCircle
    },
    active: {
        label: "Actif",
        className: "bg-success/10 text-success border-success/30",
        icon: ShieldCheck
    },
    inactive: {
        label: "Inactif",
        className: "bg-secondary/10 text-secondary-foreground border-border",
        icon: Shield
    },
    suspended: {
        label: "Suspendu",
        className: "bg-destructive/10 text-destructive border-destructive/30",
        icon: ShieldAlert
    },
}


// Helper function to mask API keys
export const maskApiKey = (key: string): string => {
    if (!key || key.length < 6) return key;
    const firstTwo = key.substring(0, 2);
    const lastFour = key.substring(key.length - 4);
    const maskedMiddle = "*".repeat(Math.max(key.length - 6, 10));
    return `${firstTwo}${maskedMiddle}${lastFour}`;
};



export const formatRelativeDate = (date: string | Date | undefined): string => {
    if (!date) return "";

    let dateObj: Date;
    if (typeof date === 'string') {
        let cleanDate = date;
        // If it's a typical ISO format but missing timezone info, treat as UTC
        if (cleanDate.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) && !cleanDate.includes('Z') && !cleanDate.includes('+')) {
            cleanDate += 'Z';
        }
        dateObj = new Date(cleanDate);
    } else {
        dateObj = date;
    }

    if (isNaN(dateObj.getTime())) return "";

    const now = new Date();
    // Use a small 5s buffer to handle slight clock sync issues between client and server
    const diffInMs = Math.max(0, now.getTime() - dateObj.getTime() + 5000);
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);

    if (diffInMinutes < 60) {
        return `Il y a ${Math.max(1, diffInMinutes)} min`;
    }
    if (diffInHours < 24) {
        return `Il y a ${diffInHours} h`;
    }
    if (diffInDays < 7) {
        return `Il y a ${diffInDays} j`;
    }
    if (diffInWeeks < 4) {
        return `Il y a ${diffInWeeks} sem.`;
    }

    return dateObj.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: diffInDays > 365 ? "numeric" : undefined
    });
};

export const iconMap: Record<string, React.ElementType> = {
    "Users": Users,
    "ScanLine": ScanLine,
    "Building2": Building2,
    "FileText": FileText,
    "TrendingUp": TrendingUp,
    "Euro": Euro,
}