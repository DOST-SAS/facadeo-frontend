import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function AdminSettingsSkeleton() {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>

            <div className="relative mx-auto px-6 py-8">
                <header className="mb-8 space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </header>

                <div className="space-y-6">
                    {/* Tabs List Stub */}
                    <div className="grid w-full grid-cols-3 lg:w-[600px] gap-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>

                    {/* Content Card Stub */}
                    <Card>
                        <CardHeader className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-72" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Mimic a few form fields */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-4 w-56" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-4 w-56" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-4 w-56" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-4 w-56" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Skeleton className="h-10 w-32" />
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
