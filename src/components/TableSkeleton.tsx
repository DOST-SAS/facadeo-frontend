import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton() {
    return (
        <div className="overflow-x-auto w-full space-y-4">
            {/* Table Skeleton */}
            <table className="w-full table-auto border-collapse">
                <thead>
                    <tr className="bg-muted ">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <th key={idx} className="px-6 py-3 text-left">
                                <Skeleton className="h-4 w-24" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                    {Array.from({ length: 6 }).map((_, rowIdx) => (
                        <tr key={rowIdx} className="bg-white dark:bg-gray-900">
                            {Array.from({ length: 4 }).map((_, colIdx) => (
                                <td key={colIdx} className="px-6 py-4">
                                    <Skeleton className="h-4 w-full" />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination Skeleton */}
            <div className="flex justify-end gap-2 mt-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-8 w-12 rounded-md" />
                ))}
            </div>
        </div>
    );
}
