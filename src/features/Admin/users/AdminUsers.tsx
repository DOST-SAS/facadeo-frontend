import { useEffect, useMemo, useState } from "react"
import { Eye, Trash2, Search, MoreVertical, UserPlus, UserIcon, Mail, Ban, CheckCircle, Phone, Calendar, Clock, Activity, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom"
import { TableSkeleton } from "@/components/TableSkeleton"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import type { User, UserRole, UserStatus } from "../../../types/usersTypes"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { statusBadgeConfig, cn } from "@/lib/utils"
import { DeleteModal } from "@/components/DeleteModel"

import { UsersServiceInstance } from "@/services/admin/UsersServices"
import toast from "react-hot-toast"




const roleConfig: Record<UserRole, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    admin: { label: "Admin", variant: "default" },
    artisan: { label: "Artisan", variant: "secondary" },
}

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([])
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all")
    const [loading, setLoading] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true)
            try {
                const filters = {
                    searchterm: searchQuery,
                    status: statusFilter
                }
                const result = await UsersServiceInstance.getUsers(page, pageSize, filters)
                setUsers(result.data)
                const total = result.pagination?.totalPages || Math.ceil((result.pagination?.total || 0) / pageSize)
                setTotalPages(total)
            } catch (error) {
                console.error("Error fetching users:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchUsers()
    }, [page, pageSize, searchQuery, statusFilter])






    const columns = useMemo<ColumnDef<User>[]>(
        () => [
            {
                id: "index",
                header: "N°",
                cell: ({ row }) => (
                    <div className="text-sm font-medium text-foreground/80">
                        {row.index + 1 + (page - 1) * pageSize}
                    </div>
                )
            },
            {
                accessorKey: "name",
                header: "Utilisateur",
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center border text-xs font-medium">
                            {row.original.avatar && row.original.avatar !== "default-avatar.png" ? (
                                <img
                                    src={row.original.avatar}
                                    alt={row.original.display_name}
                                    className="h-full w-full object-cover rounded-full"
                                />
                            ) : (
                                row.original.display_name?.substring(0, 2).toUpperCase()
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-foreground/80 truncate block max-w-[200px]">{row.original.display_name}</span>
                            <span className="text-xs text-muted-foreground">{row.original.email}</span>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: "role",
                header: "Rôle",
                cell: ({ row }) => {
                    const config = roleConfig[row.original.role];
                    return (
                        <Badge variant={config?.variant || "outline"} className="capitalize">
                            {config?.label || row.original.role}
                        </Badge>
                    )
                }
            },
            {
                accessorKey: "numberScans",
                header: "Scans",
                cell: ({ row }) => (
                    <div className="text-center font-medium">
                        {row.original.numberScans || 0}
                    </div>
                ),
            },
            {
                accessorKey: "numberDevis",
                header: "Devis",
                cell: ({ row }) => (
                    <div className="text-center font-medium">
                        {row.original.numberDevis || 0}
                    </div>
                ),
            },

            {
                accessorKey: "joinDate",
                header: "Inscrit le",
                cell: ({ row }) => (
                    <div className="text-sm text-muted-foreground">
                        {new Date(row.original.created_at).toLocaleDateString('fr-FR')}
                    </div>
                ),
            },
            {
                accessorKey: "status",
                header: "Statut",
                cell: ({ row }) => {
                    const status = row.original.status;
                    const config = statusBadgeConfig[status] || statusBadgeConfig["inactive"]; // Fallback
                    const Icon = config.icon;
                    return (
                        <span
                            className={cn("inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium tracking-wide rounded-lg border transition-all", config.className)}
                        >
                            <Icon className="h-3 w-3" />
                            {config.label}
                        </span>
                    )
                },
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <div className="flex items-center justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 p-2! rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => {
                                    setSelectedUser(row.original)
                                    setIsDetailsOpen(true)
                                }}>
                                    <Eye className="h-4 w-4 group-hover:text-primary" />
                                    Voir le profil
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive"
                                    onClick={() => handleDeleteClick(row.original)}
                                >
                                    <Trash2 className="h-4 w-4 group-hover:text-primary" />
                                    Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
            },
        ],
        [page, pageSize]
    )

    const handleUpdateStatus = (userId: string, newStatus: UserStatus) => {
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u))
        if (selectedUser && selectedUser.id === userId) {
            setSelectedUser({ ...selectedUser, status: newStatus })
        }
        try {
            UsersServiceInstance.UpdateUser(userId, { status: newStatus })
            toast.success("User status updated successfully")
        } catch (error) {
            console.error("Error updating user status:", error)
            toast.error("Error updating user status")
        }
    }

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user)
        setIsDeleteModalOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return

        setIsDeleting(true)
        try {
            await UsersServiceInstance.deleteUser(userToDelete.id)
            setUsers(users.filter(u => u.id !== userToDelete.id))
            toast.success("Utilisateur supprimé avec succès")
            setIsDeleteModalOpen(false)
            setUserToDelete(null)
            // Close details dialog if the deleted user was being viewed
            if (selectedUser?.id === userToDelete.id) {
                setIsDetailsOpen(false)
                setSelectedUser(null)
            }
        } catch (error) {
            console.error("Error deleting user:", error)
            toast.error("Erreur lors de la suppression de l'utilisateur")
        } finally {
            setIsDeleting(false)
        }
    }


    return (
        <div className="min-h-screen bg-background relative overflow-hidden ">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,200,0.03)_1px,transparent_1px)] bg-size-[50px_50px]" />
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[80px]" />
            </div>

            <div className="relative mx-auto   px-6 py-8 rounded-sm">
                {/* Header */}
                <header className="mb-7 flex items-center justify-between">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-foreground/70">Gestion des utilisateurs</h1>
                    </div>
                </header>


                {/* Filters Section */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-sm shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par nom ou email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-full"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={(value) => setStatusFilter(value as UserStatus | "all")}
                    >
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="inactive">Inactif</SelectItem>
                            <SelectItem value="suspended">Suspendu</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table Section */}
                <section>
                    {
                        loading ? (
                            <TableSkeleton />
                        ) : users.length === 0 ? (
                            <Empty className="bg-card shadow-sm border">
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <UserIcon />
                                    </EmptyMedia>
                                    <EmptyTitle>Aucun utilisateur trouvé</EmptyTitle>
                                    <EmptyDescription>
                                        {searchQuery || statusFilter !== "all"
                                            ? "Aucun résultat ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                                            : "Aucun utilisateur n'a été créé pour le moment."}
                                    </EmptyDescription>
                                </EmptyHeader>
                                {!searchQuery && statusFilter === "all" && (
                                    <EmptyContent>
                                        <Link to="/admin/users/create">
                                            <Button>
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Créer un nouvel utilisateur
                                            </Button>
                                        </Link>
                                    </EmptyContent>
                                )}
                            </Empty>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={users}
                                manualPagination={true}
                                pageIndex={page - 1}
                                pageCount={totalPages}
                                onPageChange={(newPageIndex) => setPage(newPageIndex + 1)}
                                pageSize={pageSize}
                            />
                        )}
                </section>
            </div>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="px-6 py-3 bg-muted/20 border-b">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <UserIcon className="h-5 w-5 text-primary" />
                            Profil Utilisateur
                        </DialogTitle>
                        <DialogDescription>
                            Gérez les informations et le statut de cet utilisateur.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="flex flex-col">
                            {/* Profile Header Block */}
                            <div className="px-6 py-2 flex flex-col items-center">
                                <div className="relative mb-">
                                    <div className="h-24 w-24 rounded-full bg-background p-1 shadow-lg ring-2 ring-border/50">
                                        <div className="h-full w-full rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                                            {selectedUser.avatar && selectedUser.avatar !== "default-avatar.png" ? (
                                                <img
                                                    src={selectedUser.avatar}
                                                    alt={selectedUser.display_name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-2xl font-bold text-muted-foreground">{selectedUser.display_name?.substring(0, 2).toUpperCase()}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1">
                                        <Badge variant={roleConfig[selectedUser.role]?.variant || "outline"} className="shadow-sm border-background border-2 px-2 py-0.5 text-xs capitalize">
                                            {roleConfig[selectedUser.role]?.label || selectedUser.role}
                                        </Badge>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-1">{selectedUser.display_name}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                    <Mail className="h-3.5 w-3.5" />
                                    {selectedUser.email}
                                </div>

                                <div className="w-full grid grid-cols-2 gap-3 mb-2">
                                    <Card className="bg-muted/10 border-0 shadow-none ring-1 ring-border/40 py-1 px-6">
                                        <CardContent className=" flex items-center justify-between p-0">
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground mb-1">Scans réalisés</p>
                                                <p className="text-xl font-bold">{selectedUser.numberScans || 0}</p>
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Activity className="h-4 w-4" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-muted/10 border-0 shadow-none ring-1 ring-border/40 py-1 px-6">
                                        <CardContent className="p-0 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground mb-1">Devis générés</p>
                                                <p className="text-xl font-bold">{selectedUser.numberDevis || 0}</p>
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
                                                <Activity className="h-4 w-4" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* <Separator /> */}

                            {/* Details Grid */}
                            <div className="px-6 py-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8 text-sm">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Phone className="h-3.5 w-3.5" />
                                            <span className="text-xs font-medium uppercase tracking-wider">Téléphone</span>
                                        </div>
                                        <p className="font-medium pl-6">{selectedUser.phone || "Non renseigné"}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span className="text-xs font-medium uppercase tracking-wider">Date d'inscription</span>
                                        </div>
                                        <p className="font-medium pl-6">{new Date(selectedUser.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span className="text-xs font-medium uppercase tracking-wider">Dernière connexion</span>
                                        </div>
                                        <p className="font-medium pl-6">
                                            {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString('fr-FR') : "Jamais"}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <ShieldAlert className="h-3.5 w-3.5" />
                                            <span className="text-xs font-medium uppercase tracking-wider">Statut du compte</span>
                                        </div>
                                        <div className="pl-6">
                                            {(() => {
                                                const config = statusBadgeConfig[selectedUser.status] || statusBadgeConfig["inactive"];
                                                const Icon = config.icon;
                                                return (
                                                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium tracking-wide rounded-full border", config.className)}>
                                                        <Icon className="h-3 w-3" />
                                                        {config.label}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="px-6 py-2 bg-muted/20 border-t flex sm:justify-between items-center gap-3">
                                <Button variant="ghost" onClick={() => setIsDetailsOpen(false)}>
                                    Fermer
                                </Button>
                                {selectedUser.status === 'suspended' ? (
                                    <Button onClick={() => handleUpdateStatus(selectedUser.id, 'active')} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                                        <CheckCircle className=" h-4 w-4" />
                                        Réactiver le compte
                                    </Button>
                                ) : (
                                    <Button onClick={() => handleUpdateStatus(selectedUser.id, 'suspended')} variant="destructive" className="shadow-sm">
                                        <Ban className=" h-4 w-4" />
                                        Suspendre l'accès
                                    </Button>
                                )}
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false)
                    setUserToDelete(null)
                }}
                onConfirm={handleDeleteConfirm}
                loading={isDeleting}
                title="Supprimer cet utilisateur ?"
                description={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userToDelete?.display_name}" ? Cette action est irréversible et supprimera définitivement toutes les données associées à cet utilisateur.`}
            />
        </div>
    )
}