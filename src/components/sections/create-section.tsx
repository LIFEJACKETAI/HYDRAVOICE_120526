'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import { uploadDocument } from '@/lib/api'
import {
  playVoicePreview,
  stopVoicePreview,
  isVoicePreviewPlaying,
  convertTextToAudio,
  downloadAudioBlob,
  revokeAudioUrl,
  type ConversionProgress,
} from '@/lib/puter-tts'
import { VOICE_PROFILES } from '@/lib/voices'
import {
  Upload,
  FileText,
  Play,
  Pause,
  Download,
  X,
  Volume2,
  Loader2,
  CheckCircle2,
  File,
  Music,
  AlertCircle,
  AudioWaveform,
  Server,
  Shield,
  LogIn,
} from 'lucide-react'

interface Voice {
  id: string
  name: string
  accent: string
  gender: 'Female' | 'Male'
  description: string
  category: string
  previewText: string
  sdkVoice: string
}

const VOICES: Voice[] = VOICE_PROFILES.map((v) => ({
  id: v.id,
  name: v.name,
  accent: v.accent,
  gender: v.gender === 'female' ? 'Female' : 'Male',
  description: v.description,
  category:
    v.accent === 'American'
      ? v.gender === 'female'
        ? 'american-female'
        : 'american-male'
      : v.gender === 'female'
        ? 'british-female'
        : 'british-male',
  previewText: v.previewText,
  sdkVoice: v.sdkVoice,
}))

const VOICE_FILTERS = [
  { value: 'all', label: 'All Voices' },
  { value: 'american-female', label: 'American Female' },
  { value: 'american-male', label: 'American Male' },
  { value: 'british-female', label: 'British Female' },
  { value: 'british-male', label: 'British Male' },
]

interface UploadedFile {
  file: File
  name: string
  size: string
  type: string
  documentId?: string
  textLength?: number
  textContent?: string
}

export function CreateSection() {
  const { isAuthenticated, user } = useAppStore()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [voiceFilter, setVoiceFilter] = useState('all')
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [converting, setConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [converted, setConverted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioFileSize, setAudioFileSize] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [textInput, setTextInput] = useState('')
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload')

  const filteredVoices = voiceFilter === 'all' ? VOICES : VOICES.filter((v) => v.category === voiceFilter)

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) revokeAudioUrl(audioUrl)
    }
  }, [audioUrl])

  // Stop voice preview on unmount
  useEffect(() => {
    return () => {
      stopVoicePreview()
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const processFile = async (file: File) => {
    const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|txt|docx)$/i)) {
      toast({ title: 'Invalid file type', description: 'Please upload a PDF, TXT, or DOCX file.', variant: 'destructive' })
      return
    }
    const sizeStr = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE'

    setUploadedFile({ file, name: file.name, size: sizeStr, type: ext })
    setConverted(false)
    setProgress(0)
    setError(null)
    setAudioUrl(null)
    setAudioBlob(null)

    // Always try server-side upload for text extraction (works for both auth and guest users)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadDocument(formData)
      setUploadedFile({
        file,
        name: file.name,
        size: sizeStr,
        type: ext,
        documentId: result.document.id !== 'guest' ? result.document.id : undefined,
        textLength: result.document.textLength,
        textContent: (result.document as any).textContent || '',
      })
      toast({ title: 'Text extracted', description: `${file.name} — ${result.document.textLength.toLocaleString()} characters extracted.` })
    } catch (err) {
      // Fallback: try client-side text extraction for TXT files
      const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
      if (fileExt === 'txt') {
        try {
          const text = await file.text()
          if (text.trim()) {
            setUploadedFile({
              file,
              name: file.name,
              size: sizeStr,
              type: ext,
              textContent: text.trim(),
              textLength: text.trim().length,
            })
            toast({ title: 'Text extracted', description: `${text.trim().length.toLocaleString()} characters read from file.` })
            setUploading(false)
            return
          }
        } catch {
          // Client-side fallback also failed
        }
      }
      toast({ title: 'Upload failed', description: 'Failed to process file. Try pasting text directly.', variant: 'destructive' })
      setError('Upload failed — try pasting text instead')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const removeFile = () => {
    setUploadedFile(null)
    setConverted(false)
    setProgress(0)
    setError(null)
    if (audioUrl) revokeAudioUrl(audioUrl)
    setAudioUrl(null)
    setAudioBlob(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }

  const handlePlayPreview = async (voiceId: string) => {
    // If already playing this voice, stop it
    if (playingVoice === voiceId) {
      stopVoicePreview()
      setPlayingVoice(null)
      return
    }

    // Stop any current preview
    stopVoicePreview()
    setPlayingVoice(null)

    setLoadingPreview(voiceId)
    try {
      await playVoicePreview(voiceId)
      setPlayingVoice(voiceId)
    } catch (err: any) {
      toast({
        title: 'Preview Failed',
        description: err.message || 'Could not play voice preview. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoadingPreview(null)
    }
  }

  // Listen for when preview audio ends to clear playing state
  useEffect(() => {
    const interval = setInterval(() => {
      if (playingVoice && !isVoicePreviewPlaying(playingVoice)) {
        setPlayingVoice(null)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [playingVoice])

  // Get the text content for conversion
  const getTextForConversion = (): string | null => {
    if (inputMode === 'text' && textInput.trim()) {
      return textInput.trim()
    }
    if (uploadedFile?.textContent) {
      return uploadedFile.textContent
    }
    return null
  }

  const handleConvert = async () => {
    const text = getTextForConversion()
    if (!text || !selectedVoice) return

    // Clean up any previous audio
    if (audioUrl) revokeAudioUrl(audioUrl)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setConverting(true)
    setProgress(0)
    setProgressMessage('Starting conversion...')
    setError(null)
    setConverted(false)
    setAudioUrl(null)
    setAudioBlob(null)
    setIsPlaying(false)

    try {
      const result = await convertTextToAudio(text, selectedVoice, (p: ConversionProgress) => {
        setProgress(p.percent)
        setProgressMessage(p.message)
      })

      setAudioBlob(result.audioBlob)
      setAudioUrl(result.audioUrl)
      setAudioDuration(result.totalDuration)
      setAudioFileSize(result.totalSize)
      setConverted(true)
      setConverting(false)
      setProgress(100)
      setProgressMessage('')

      toast({
        title: 'Conversion complete!',
        description: `Your audiobook is ready. ${formatDuration(result.totalDuration)} of audio generated.`,
      })
    } catch (err: any) {
      setConverting(false)
      setError(err.message || 'Conversion failed')
      toast({
        title: 'Conversion failed',
        description: err.message || 'Something went wrong during conversion.',
        variant: 'destructive',
      })
    }
  }

  const handleDownload = () => {
    if (!audioBlob) return
    const filename = uploadedFile
      ? `${uploadedFile.name.replace(/\.[^.]+$/, '')}_audiobook`
      : 'hydravoice_audiobook'
    downloadAudioBlob(audioBlob, filename)
    toast({ title: 'Download started', description: 'Your audiobook is being downloaded.' })
  }

  const togglePlayback = () => {
    if (!audioUrl) return

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => setIsPlaying(false)
      audioRef.current.onerror = () => {
        setIsPlaying(false)
        toast({ title: 'Playback error', description: 'Could not play the audio. Try downloading instead.', variant: 'destructive' })
      }
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(() => {
        setIsPlaying(false)
        toast({ title: 'Playback error', description: 'Could not play the audio. Try downloading instead.', variant: 'destructive' })
      })
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const hasText = !!getTextForConversion()
  const canConvert = hasText && selectedVoice && !converting

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Create Your Audiobook</h1>
        <p className="text-muted-foreground">Upload a document or paste text, choose a voice, and generate your audiobook</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={inputMode === 'upload' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMode('upload')}
              className={inputMode === 'upload' ? 'bg-primary text-primary-foreground' : ''}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
            <Button
              variant={inputMode === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMode('text')}
              className={inputMode === 'text' ? 'bg-primary text-primary-foreground' : ''}
            >
              <FileText className="mr-2 h-4 w-4" />
              Paste Text
            </Button>
          </div>

          {inputMode === 'upload' ? (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Upload Document
              </h2>

              {!uploadedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                    isDragOver
                      ? 'border-primary bg-primary/5 teal-glow-sm'
                      : 'border-border hover:border-primary/50 hover:bg-accent/30'
                  }`}
                >
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Drag and drop your file here</p>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                  <Badge variant="secondary" className="text-xs">PDF • TXT • DOCX</Badge>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <Card className="glass">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <File className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{uploadedFile.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{uploadedFile.type}</Badge>
                          <span className="text-xs text-muted-foreground">{uploadedFile.size}</span>
                          {uploadedFile.textLength !== undefined && (
                            <span className="text-xs text-primary">{uploadedFile.textLength.toLocaleString()} chars</span>
                          )}
                          {uploadedFile.documentId && (
                            <Badge className="text-xs bg-primary/15 text-primary border-primary/30">Uploaded</Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={removeFile} className="flex-shrink-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!isAuthenticated && (
                <div className="mt-4 glass rounded-xl p-4 flex items-center gap-3 border-primary/30">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Sign in for longer conversions (up to 50,000 characters) and to save your documents.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Paste Your Text
              </h2>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste or type your text here to convert it to speech..."
                className="w-full h-48 rounded-xl border border-border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {textInput.length.toLocaleString()} characters
                </span>
                {textInput.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setTextInput('')} className="text-xs text-muted-foreground">
                    Clear
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Auth-based conversion limit notice */}
          {!isAuthenticated && (
            <div className="glass rounded-xl p-3 flex items-center gap-3 border-primary/30">
              <LogIn className="h-4 w-4 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Sign in for longer conversions (up to 50,000 characters)
              </p>
            </div>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <div className="glass rounded-xl p-3 flex items-center gap-3 border-primary/30">
              <Shield className="h-4 w-4 text-primary flex-shrink-0" />
              <p className="text-sm text-primary font-medium">
                Admin mode — unlimited conversions
              </p>
            </div>
          )}

          {/* Convert Button & Progress */}
          {(hasText || uploadedFile) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading file...
                </div>
              )}

              {(converting || (progress > 0 && progress < 100)) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Server className="h-3.5 w-3.5 text-primary" />
                      {progressMessage || 'Converting to audio...'}
                    </span>
                    <span className="text-primary font-medium">{Math.min(Math.round(progress), 100)}%</span>
                  </div>
                  <Progress value={Math.min(progress, 100)} className="h-2" />
                </div>
              )}

              {error && (
                <div className="glass rounded-xl p-4 border-destructive/30 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  {error}
                </div>
              )}

              {converted && audioUrl && (
                <Card className="glass border-primary/30">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Conversion complete!</span>
                      <Badge variant="secondary" className="text-xs ml-2">
                        <Server className="h-3 w-3 mr-1" /> Server
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Duration: <span className="text-foreground font-medium">{formatDuration(audioDuration)}</span></p>
                      <p>File size: <span className="text-foreground font-medium">{formatFileSize(audioFileSize)}</span></p>
                    </div>
                    {/* Audio player */}
                    <div className="glass rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Button
                          size="icon"
                          onClick={togglePlayback}
                          className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                        </Button>
                        <div className="flex-1">
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-primary rounded-full"
                              initial={{ width: '0%' }}
                              animate={{ width: isPlaying ? '100%' : '0%' }}
                              transition={{ duration: audioDuration || 30, ease: 'linear' }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-muted-foreground">
                              {isPlaying ? 'Playing...' : '0:00'}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatDuration(audioDuration)}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleDownload}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Audio
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!converted && !error && (
                <Button
                  size="lg"
                  onClick={handleConvert}
                  disabled={!canConvert}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 teal-glow-sm"
                >
                  {converting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Converting...
                    </>
                  ) : !selectedVoice ? (
                    <>
                      <Volume2 className="mr-2 h-4 w-4" />
                      Select a voice to convert
                    </>
                  ) : !hasText ? (
                    <>
                      <Volume2 className="mr-2 h-4 w-4" />
                      Add text to convert
                    </>
                  ) : (
                    <>
                      <Volume2 className="mr-2 h-4 w-4" />
                      Convert to Audiobook
                    </>
                  )}
                </Button>
              )}
              {!selectedVoice && hasText && (
                <p className="text-xs text-muted-foreground text-center">
                  Click on a voice card to select it, then convert
                </p>
              )}
              {!hasText && selectedVoice && (
                <p className="text-xs text-muted-foreground text-center">
                  Upload a file or paste text to start converting
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Voice Selector */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Choose a Voice
          </h2>

          <Tabs value={voiceFilter} onValueChange={setVoiceFilter}>
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-secondary/50 p-1">
              {VOICE_FILTERS.map((f) => (
                <TabsTrigger key={f.value} value={f.value} className="text-xs flex-1 min-w-0">
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="max-h-[520px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredVoices.map((voice) => (
                <motion.div
                  key={voice.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedVoice === voice.id
                        ? 'border-primary bg-primary/5 teal-glow-sm'
                        : 'glass hover:border-primary/30'
                    }`}
                    onClick={() => setSelectedVoice(voice.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          selectedVoice === voice.id ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'
                        }`}>
                          {playingVoice === voice.id ? (
                            <div className="flex items-end gap-0.5 h-4">
                              {[1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className={`w-1 bg-current rounded-full sound-bar-${i}`}
                                  style={{ height: '100%' }}
                                />
                              ))}
                            </div>
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{voice.name}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {voice.accent}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {voice.gender}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{voice.description}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          disabled={loadingPreview !== null && loadingPreview !== voice.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedVoice(voice.id)
                            handlePlayPreview(voice.id)
                          }}
                        >
                          {loadingPreview === voice.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : playingVoice === voice.id ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Voice preview hint */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AudioWaveform className="h-3.5 w-3.5 text-primary" />
            <span>Click a voice card to select it. The play button lets you preview the voice.</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
