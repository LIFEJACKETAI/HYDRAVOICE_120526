'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import {
  getAdminAnalytics,
  getAdminUsers,
  updateUser,
  deleteUser,
  getSystemHealth,
  runMaintenance,
  type AdminAnalytics,
  type AdminUser,
  type SystemHealth,
} from '@/lib/api'
import {
  Users,
  FileText,
  Activity,
  DollarSign,
  Search,
  Trash2,
  Shield,
  Database,
  HardDrive,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
  RefreshCw,
  Wrench,
  Zap,
  UserCog,
  Crown,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}

export function AdminSection() {
  const { user, setCurrentPage } = useAppStore()
  const { toast } = useToast()

  // Analytics state
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // System health state
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)

  // Edit user dialog
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editPlan, setEditPlan] = useState('')
  const [editName, setEditName] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Maintenance state
  const [maintenanceLoading, setMaintenanceLoading] = useState<string | null>(null)

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const data = await getAdminAnalytics()
      setAnalytics(data)
    } catch (err: any) {
      toast({ title: 'Failed to load analytics', description: err.message, variant: 'destructive' })
    } finally {
      setAnalyticsLoading(false)
    }
  }, [toast])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const data = await getAdminUsers({ search: userSearch || undefined, page: userPage, limit: 20 })
      setUsers(data.users)
      setTotalUsers(data.pagination.total)
      setTotalPages(data.pagination.totalPages)
    } catch (err: any) {
      toast({ title: 'Failed to load users', description: err.message, variant: 'destructive' })
    } finally {
      setUsersLoading(false)
    }
  }, [userSearch, userPage, toast])

  // Fetch system health
  const fetchSystemHealth = useCallback(async () => {
    setHealthLoading(true)
    try {
      const data = await getSystemHealth()
      setSystemHealth(data)
    } catch (err: any) {
      toast({ title: 'Failed to load system health', description: err.message, variant: 'destructive' })
    } finally {
      setHealthLoading(false)
    }
  }, [toast])

  // Initial data load
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAnalytics()
      fetchUsers()
      fetchSystemHealth()
    }
  }, [user?.role, fetchAnalytics, fetchUsers, fetchSystemHealth])

  // Refetch users when search/page changes
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers()
    }
  }, [userSearch, userPage, user?.role, fetchUsers])

  // Handle edit user
  const handleEditUser = (u: AdminUser) => {
    setEditUser(u)
    setEditRole(u.role)
    setEditPlan(u.plan)
    setEditName(u.name || '')
  }

  const handleSaveEdit = async () => {
    if (!editUser) return
    setEditSaving(true)
    try {
      await updateUser(editUser.id, { role: editRole, plan: editPlan, name: editName })
      toast({ title: 'User updated', description: `${editUser.email} has been updated.` })
      setEditUser(null)
      fetchUsers()
      fetchAnalytics()
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' })
    } finally {
      setEditSaving(false)
    }
  }

  // Handle delete user
  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      await deleteUser(userId)
      toast({ title: 'User deleted', description: `${userName} has been removed.` })
      fetchUsers()
      fetchAnalytics()
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' })
    }
  }

  // Handle maintenance action
  const handleMaintenance = async (action: string, label: string) => {
    setMaintenanceLoading(action)
    try {
      const result = await runMaintenance(action)
      toast({
        title: `${label} complete`,
        description: result.message,
      })
      // Refresh health data after maintenance
      fetchSystemHealth()
      if (action === 'db_stats') {
        fetchAnalytics()
      }
    } catch (err: any) {
      toast({ title: `${label} failed`, description: err.message, variant: 'destructive' })
    } finally {
      setMaintenanceLoading(null)
    }
  }

  // Access denied
  if (!user || user.role !== 'admin') {
    return (
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">You need admin privileges to view this page</p>
          <Button onClick={() => setCurrentPage('home')} className="bg-primary text-primary-foreground">
            Go Home
          </Button>
        </motion.div>
      </div>
    )
  }

  const planBadgeColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-primary/15 text-primary border-primary/30'
      case 'pro': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
      case 'starter': return 'bg-blue-500/15 text-blue-400 border-blue-500/20'
      default: return ''
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="h-8 w-8 text-primary" />
          <h1 className="text-3xl sm:text-4xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Full system access — analytics, user management, maintenance, and paywall bypass</p>
      </motion.div>

      {/* Analytics Cards */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={stagger}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {analyticsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : analytics ? (
          [
            { title: 'Total Users', value: analytics.totalUsers.toLocaleString(), icon: Users, extra: `${analytics.recentSignups} new (30d)` },
            { title: 'Total Documents', value: analytics.totalDocuments.toLocaleString(), icon: FileText, extra: `${analytics.recentConversions} conversions (30d)` },
            { title: 'Total Conversions', value: analytics.totalConversions.toLocaleString(), icon: Activity, extra: 'All time' },
            { title: 'Revenue', value: `$${analytics.totalRevenue.toLocaleString()}`, icon: DollarSign, extra: 'Completed payments' },
          ].map((stat, i) => (
            <motion.div key={i} variants={fadeInUp}>
              <Card className="glass">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
                  <p className="text-xs text-primary mt-0.5">{stat.extra}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : null}
      </motion.div>

      {/* Plan Distribution */}
      {analytics && analytics.usersByPlan.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Users by Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {analytics.usersByPlan.map((item) => (
                  <div key={item.plan} className="text-center">
                    <p className="text-2xl font-bold">{item.count}</p>
                    <Badge variant="secondary" className={`text-xs mt-1 ${planBadgeColor(item.plan)}`}>
                      {item.plan}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Users
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            System
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1.5">
            <Wrench className="h-3.5 w-3.5" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        {/* ─── Users Tab ─── */}
        <TabsContent value="users">
          <Card className="glass">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User Management
                  <Badge variant="secondary" className="ml-2">{totalUsers} total</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email or name..."
                      value={userSearch}
                      onChange={(e) => { setUserSearch(e.target.value); setUserPage(1) }}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={() => fetchUsers()} title="Refresh">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {userSearch ? 'No users match your search' : 'No users found'}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Docs</TableHead>
                          <TableHead>Payments</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{u.name || '—'}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  u.role === 'admin'
                                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                                    : ''
                                }`}
                              >
                                {u.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-xs ${planBadgeColor(u.plan)}`}>
                                {u.plan}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{u.documentCount}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{u.paymentCount}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{formatDate(u.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditUser(u)}
                                  title="Edit user"
                                >
                                  <UserCog className="h-4 w-4" />
                                </Button>
                                {u.id !== user.id && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete user">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="glass-strong">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete <strong>{u.name || u.email}</strong>? This will permanently remove their account,
                                          all documents, and audio files.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteUser(u.id, u.name || u.email)}
                                          className="bg-destructive text-white hover:bg-destructive/90"
                                        >
                                          Delete User
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        Page {userPage} of {totalPages} ({totalUsers} users)
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage(p => Math.max(1, p - 1))}
                          disabled={userPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage(p => Math.min(totalPages, p + 1))}
                          disabled={userPage >= totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── System Health Tab ─── */}
        <TabsContent value="system">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                System Health
              </h3>
              <Button variant="outline" size="sm" onClick={fetchSystemHealth} className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>

            {healthLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : systemHealth ? (
              <>
                {/* Uptime & Platform */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="glass">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Uptime</span>
                      </div>
                      <p className="text-2xl font-bold">{systemHealth.uptime.formatted}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Node Version</span>
                      </div>
                      <p className="text-2xl font-bold">{systemHealth.nodeVersion}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Platform</span>
                      </div>
                      <p className="text-2xl font-bold capitalize">{systemHealth.platform}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Storage */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-primary" />
                      Storage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Database</span>
                          <span className="font-medium">{systemHealth.database.sizeMB} MB</span>
                        </div>
                        <Progress value={Math.min((systemHealth.database.sizeMB / 100) * 100, 100)} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Uploads</span>
                          <span className="font-medium">{systemHealth.storage.uploadsMB} MB</span>
                        </div>
                        <Progress value={Math.min((systemHealth.storage.uploadsMB / 500) * 100, 100)} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Audio Output</span>
                          <span className="font-medium">{systemHealth.storage.audioOutputMB} MB</span>
                        </div>
                        <Progress value={Math.min((systemHealth.storage.audioOutputMB / 1000) * 100, 100)} className="h-2" />
                      </div>
                      <div className="pt-2 border-t border-border">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground font-medium">Total Storage</span>
                          <span className="font-bold text-primary">{systemHealth.storage.totalMB} MB</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Memory */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      Memory
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Process Memory</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Heap Used</span>
                            <span className="font-medium">{systemHealth.memory.process.heapUsedMB} MB</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Heap Total</span>
                            <span className="font-medium">{systemHealth.memory.process.heapTotalMB} MB</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>RSS</span>
                            <span className="font-medium">{systemHealth.memory.process.rssMB} MB</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">System Memory</h4>
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Used</span>
                              <span className="font-medium">{systemHealth.memory.system.usedPercent.toFixed(1)}%</span>
                            </div>
                            <Progress value={systemHealth.memory.system.usedPercent} className="h-2" />
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total</span>
                            <span className="font-medium">{systemHealth.memory.system.totalMB} MB</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Free</span>
                            <span className="font-medium text-emerald-400">{systemHealth.memory.system.freeMB} MB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Document Status Distribution */}
                {analytics && analytics.documentsByStatus.length > 0 && (
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Documents by Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {analytics.documentsByStatus.map((item) => (
                          <div key={item.status} className="text-center">
                            <p className="text-2xl font-bold">{item.count}</p>
                            <Badge
                              variant="secondary"
                              className={`text-xs mt-1 ${
                                item.status === 'completed' || item.status === 'converted'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                                  : item.status === 'processing' || item.status === 'converting'
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                                  : item.status === 'failed' || item.status === 'error'
                                  ? 'bg-red-500/15 text-red-400 border-red-500/20'
                                  : ''
                              }`}
                            >
                              {item.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Failed to load system health data
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── Maintenance Tab ─── */}
        <TabsContent value="maintenance">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
                <Wrench className="h-5 w-5 text-primary" />
                System Maintenance
              </h3>
              <p className="text-sm text-muted-foreground">Perform maintenance operations on the system. These actions are immediate and irreversible.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  action: 'clear_temp_files',
                  title: 'Clear Temporary Files',
                  description: 'Delete uploaded files older than 24 hours from the uploads directory',
                  icon: Trash2,
                  color: 'text-amber-400',
                  bg: 'bg-amber-500/15',
                },
                {
                  action: 'reset_stuck_conversions',
                  title: 'Reset Stuck Conversions',
                  description: 'Mark audio files stuck in "processing" for over 1 hour as "failed"',
                  icon: RefreshCw,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/15',
                },
                {
                  action: 'reset_stuck_documents',
                  title: 'Reset Stuck Documents',
                  description: 'Mark documents stuck in "converting" for over 1 hour back to "uploaded"',
                  icon: FileText,
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/15',
                },
                {
                  action: 'clear_expired_sessions',
                  title: 'Clear Expired Sessions',
                  description: 'Remove all expired user sessions from the database',
                  icon: Clock,
                  color: 'text-purple-400',
                  bg: 'bg-purple-500/15',
                },
                {
                  action: 'db_stats',
                  title: 'Database Statistics',
                  description: 'Get detailed row counts for all database tables',
                  icon: Database,
                  color: 'text-primary',
                  bg: 'bg-primary/15',
                },
              ].map((item) => (
                <Card key={item.action} className="glass hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mb-3">{item.description}</p>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={maintenanceLoading !== null}
                              className="gap-2"
                            >
                              {maintenanceLoading === item.action ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Zap className="h-3.5 w-3.5" />
                              )}
                              Run
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass-strong">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm: {item.title}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {item.description}. This action is immediate and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleMaintenance(item.action, item.title)}
                                className="bg-primary text-primary-foreground"
                              >
                                Confirm
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Admin Info Card */}
            <Card className="glass border-primary/30">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Crown className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Admin Privileges</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Your admin account has full access to all features with no restrictions.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'Unlimited TTS conversions',
                        'No character limits',
                        'All voice profiles',
                        'Paywall bypass',
                        'User management',
                        'System maintenance',
                      ].map((priv) => (
                        <div key={priv} className="flex items-center gap-1.5 text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span>{priv}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="glass-strong sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update role, plan, and name for {editUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="User name"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {editUser?.id === user.id && editRole !== 'admin' && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  You cannot remove your own admin role
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button
              onClick={handleSaveEdit}
              disabled={editSaving}
              className="bg-primary text-primary-foreground"
            >
              {editSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
