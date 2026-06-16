import { Card } from '@/components/ui/card'
import { ArrowUpRight } from 'lucide-react'
import { cn, iconMap } from '@/lib/utils'

const StatisticsCard = ({ stat }: { stat: any }) => {
    const Icon = iconMap[stat.icon]
    return (
        <div>
            <Card
                key={stat.label}
                className="group relative overflow-hidden border border-border/30 p-3 md:p-5"
            >
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                    <div className="absolute top-0 right-0 w-px h-8 bg-linear-to-b from-primary/40 to-transparent" />
                    <div className="absolute top-0 right-0 w-8 h-px bg-linear-to-l from-primary/40 to-transparent" />
                </div>

                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary border border-border group-hover:border-primary/20 transition-colors">
                            {Icon && <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />}
                        </div>

                        <span className={cn(
                            "flex items-center gap-1 text-xs font-medium text-success",
                            stat.trend < 0 && "text-destructive"
                        )}>
                            <ArrowUpRight className={cn(
                                "h-3 w-3",
                                stat.trend < 0 && "rotate-180"
                            )} />
                            {stat.trend} %
                        </span>
                    </div>
                    <span className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</span>
                    <p className="text-xs text-muted-foreground mt-1.5 tracking-wide">{stat.label}</p>
                </div>
            </Card>

        </div>
    )
}

export default StatisticsCard