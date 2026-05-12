'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import {
  User,
  Mail,
  Shield,
  FileText,
  Music,
  Play,
  Pause,
  Download,
  Lock,
  Trash2,
  Clock,
  HardDrive,
  ArrowUpRight,
} from 'lucide-react'

// Mock data for the account section
const MOCK_DOCUMENTS = [
  { id: '1', name: 'Project_Report_Q4.pdf', type: 'PDF', size: '2.4 MB', status: 'completed', date: '2024-01-15' },
  { id: '2', name: 'Meeting_Notes.txt', type: 'TXT', size: '45 KB', status: 'completed', date: '2024-01-12' },
  { id: '3', name: 'Research_Paper.docx', type: 'DOCX', size: '1.1 MB', status: 'processing', date: '2024-01-18' },
  { id: '4', name: 'Novel_Chapter1.pdf', type: 'PDF', size: '890 KB', status: 'completed', date: '2024-01-10' },
  { id: '5', name: 'Technical_Spec.pdf', type: 'PDF', size: '3.7 MB', status: 'failed', date: '2024-01-08' },
]

const MOCK_AUDIO = [
  { id: '1', name: 'Project_Report_Q4.mp3', voice: 'Aria', duration: '18:42', size: '8.2 MB', date: '2024-01-15' },
  { id: '2', name: 'Meeting_Notes.mp3', voice: 'Brandon', duration: '4:15', size: '1.9 MB', date: '2024-01-12' },
  { id: '3', name: 'Novel_Chapter1.mp3', voice: 'Elizabeth', duration: '32:08', size: '14.5 MB', date: '2024-01-10' },
]

const PLAN_DETAILS: Record<string, { name: string; conversions: string; maxDuration: string; price: string }> = {
  free: { name: 'Starter', conversions: '3/month', maxDuration: '5 min', price: 'Free' },
  pro: { name: 'Pro', conversions: '50/month', maxDuration: '2 hours', price: '$9.99/mo' },
  enterprise: { name: 'Enterprise', conversions: 'Unlimited', maxDuration: 'Unlimited', price: '$29.99/mo' },
}

export function AccountSection() {
  const { user, logout, setCurrentPage } = useAppStore()
  const { toast } = useToast()
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  if (!user) {
    return (
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign in required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to view your account</p>
          <Button onClick={() => setCurrentPage('home')} className="bg-primary text-primary-foreground">
            Go Home
          </Button>
        </motion.div>
      </div>
    )
  }

  const plan = PLAN_DETAILS[user.plan] || PLAN_DETAILS.free

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' })
      return
    }
    if (newPassword.length < 8) {
      toast({ title: 'Password too short', description: 'Must be at least 8 characters.', variant: 'destructive' })
      return
    }
    toast({ title: 'Password updated', description: 'Your password has been changed successfully.' })
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleDeleteAccount = () => {
    toast({ title: 'Account deletion requested', description: 'Your account will be deleted within 24 hours.' })
    logout()
    setCurrentPage('home')
  }

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile, plan, and audio library</p>
      </motion.div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="library">Audio Library</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Info */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-primary text-2xl font-bold">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{user.name}</p>
                    <p className="text-muted-foreground text-sm">{user.email}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Role:</span>
                    <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Joined:</span>
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan Info */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-primary" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{plan.name}</p>
                    <p className="text-2xl font-bold gradient-text">{plan.price}</p>
                  </div>
                  {user.plan !== 'enterprise' && (
                    <Button
                      onClick={() => setCurrentPage('pricing')}
                      variant="outline"
                      className="text-primary border-primary/30 hover:bg-primary/10"
                    >
                      Upgrade
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-xl bg-secondary/30">
                    <p className="text-sm text-muted-foreground">Conversions</p>
                    <p className="font-semibold">{plan.conversions}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-secondary/30">
                    <p className="text-sm text-muted-foreground">Max Duration</p>
                    <p className="font-semibold">{plan.maxDuration}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Conversions used</span>
                    <span>2 / {plan.conversions}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: user.plan === 'free' ? '66%' : '4%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Document History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_DOCUMENTS.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{doc.type}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{doc.size}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              doc.status === 'completed'
                                ? 'default'
                                : doc.status === 'processing'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className={`text-xs capitalize ${
                              doc.status === 'completed' ? 'bg-primary/15 text-primary border-primary/30' : ''
                            }`}
                          >
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{doc.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audio Library Tab */}
        <TabsContent value="library">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Audio Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_AUDIO.map((audio) => (
                  <div key={audio.id} className="glass rounded-xl p-4 flex items-center gap-4">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setPlayingAudio(playingAudio === audio.id ? null : audio.id)}
                      className="h-10 w-10 rounded-full bg-primary/15 text-primary hover:bg-primary hover:text-primary-foreground flex-shrink-0"
                    >
                      {playingAudio === audio.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 ml-0.5" />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{audio.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">Voice: {audio.voice}</span>
                        <span className="text-xs text-muted-foreground">Duration: {audio.duration}</span>
                        <span className="text-xs text-muted-foreground">{audio.size}</span>
                      </div>
                      {playingAudio === audio.id && (
                        <div className="h-1 bg-secondary rounded-full overflow-hidden mt-2">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: '45%' }}
                            transition={{ duration: 5 }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:inline">{audio.date}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toast({ title: 'Download started', description: `Downloading ${audio.name}` })}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" className="bg-primary text-primary-foreground">
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="glass border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. All your documents, audio files,
                and data will be permanently removed.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-strong">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all of your data from our servers, including documents and audio files.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-white hover:bg-destructive/90">
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
