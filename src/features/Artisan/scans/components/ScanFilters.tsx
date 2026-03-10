import { Filter, RotateCcw, Target, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useMemo } from "react"
import type { Scan } from "@/types/scansTypes"
import { getPlaceTypeLabel } from "@/utils/businessTypeConverter"

interface ScanFiltersProps {
    scan?: Scan
    minScore: number
    maxScore: number
    selectedBusinessType: string
    isFilterOpen: boolean
    onSliderChange: (values: number[]) => void
    onBusinessTypeChange: (value: string) => void
    onResetFilters: () => void
    onFilterOpenChange: (open: boolean) => void
}

export function ScanFilters({
    scan,
    minScore,
    maxScore,
    selectedBusinessType,
    isFilterOpen,
    onSliderChange,
    onBusinessTypeChange,
    onResetFilters,
    onFilterOpenChange,
}: ScanFiltersProps) {
    const uniqueBusinessTypes = useMemo(() => {
        const types = new Set<string>()

        scan?.facades?.forEach((facade) => {
            const type = facade.address?.type || facade.business?.business_type
            if (type) {
                types.add(type)
            }
        })

        return Array.from(types).sort()
    }, [scan?.facades])

    return (
        <>
            {/* Mobile Filter Button */}
            <div className="md:hidden">
                <Sheet open={isFilterOpen} onOpenChange={onFilterOpenChange}>
                    <SheetTrigger asChild className="flex justify-end!">
                        <Button
                            variant="outline"
                            className="h-12 gap-2 bg-card border-border hover:bg-primary/5 hover:border-primary/40"
                        >
                            <Filter className="h-4 w-4" />
                            Filtres
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[95%] p-4">
                        <SheetHeader className="p-0">
                            <SheetTitle>Filtres de recherche</SheetTitle>
                            <SheetDescription>
                                Affinez vos résultats avec les filtres ci-dessous
                            </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="font-medium text-muted-foreground" htmlFor="score-filter-min">Score (0-100)</label>
                                        <div className="font-medium">
                                            <span>{minScore}</span> - <span>{maxScore}</span>
                                        </div>
                                    </div>
                                    <Slider
                                        defaultValue={[20, 80]}
                                        max={100}
                                        step={1}
                                        value={[minScore, maxScore]}
                                        onValueChange={onSliderChange}
                                        className="py-2"
                                    />
                                </div>
                                <div>
                                    <label className="font-medium text-muted-foreground" htmlFor="business-filter">Type de commerce</label>
                                    <div className="mt-1">
                                        <Select value={selectedBusinessType} onValueChange={onBusinessTypeChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner le type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Tous</SelectItem>
                                                {scan?.businesses?.map((business) => (
                                                    <SelectItem key={business.id} value={business.id}>
                                                        {getPlaceTypeLabel(business.name)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={onResetFilters}>
                                Réinitialiser
                            </Button>
                            <Button className="flex-1" onClick={() => onFilterOpenChange(false)}>
                                Appliquer
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Filters Toolbar */}
            <div className="hidden md:flex items-center justify-between p-2 rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground w-fit">
                        <Filter className="w-4 h-4" />
                        <span>Filtres</span>
                    </div>


                </div>
                <div className="flex items-center gap-4 ">
                    {/* Business Type Filter */}
                    <div className="flex items-center gap-2">
                        <Select
                            value={selectedBusinessType}
                            onValueChange={onBusinessTypeChange}
                        >
                            <SelectTrigger className="w-[180px] h-9! bg-background border-border/60">
                                <Store className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Tous les types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les types</SelectItem>
                                {uniqueBusinessTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {getPlaceTypeLabel(type)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Separator */}
                    <div className="h-6 w-px bg-border/60" />

                    {/* Score Filter Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-9 border-dashed border-border/60 bg-background hover:bg-muted/50">
                                <Target className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                Score: {minScore}-{maxScore}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" align="start">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium leading-none">Plage de score</h4>
                                    <span className="text-xs text-muted-foreground">{minScore} - {maxScore}</span>
                                </div>
                                <Slider
                                    defaultValue={[20, 80]}
                                    max={100}
                                    step={1}
                                    value={[minScore, maxScore]}
                                    onValueChange={onSliderChange}
                                    className="py-2"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>0</span>
                                    <span>100</span>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                {/* Filters Summary & Reset */}
                <div className="flex items-center gap-2 pl-4 border-l border-border/60 animate-in fade-in slide-in-from-right-2 duration-200">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onResetFilters}
                        className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                        <RotateCcw className="w-3.5 h-3.5 mr-2" />
                        Réinitialiser
                    </Button>
                </div>
            </div>
        </>
    )
}
