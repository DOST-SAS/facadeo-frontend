import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

const StatisticsSkeleton = () => {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <Card
                    key={i}
                    className="group relative overflow-hidden border border-border/30 p-3 md:p-5"
                >
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                        <Skeleton className="h-8 w-24 mb-2" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </Card>
            ))}
        </>
    )
}

export default StatisticsSkeleton