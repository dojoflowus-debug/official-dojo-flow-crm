import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc'
import {
  X,
  Search,
  Upload,
  FileText,
  File,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  Download,
  Eye,
  Loader2,
  ScrollText,
  Receipt,
  MessageSquare,
  GraduationCap,
} from 'lucide-react'

interface Student {
  id: number
  first_name: string
  last_name: string
}

interface DocumentsDrawerProps {
  student: Student | null
  isOpen: boolean
  onClose: () => void
}

const SOURCE_FILTERS = [
  { value: 'all', label: 'All', icon: File },
  { value: 'waiver', label: 'Waivers', icon: ScrollText },
  { value: 'invoice', label: 'Payments', icon: Receipt },
  { value: 'chat_upload', label: 'Messages', icon: MessageSquare },
  { value: 'manual_upload', label: 'Training', icon: GraduationCap },
]

export default function DocumentsDrawer({
  student,
  isOpen,
  onClose,
}: DocumentsDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'waiver' | 'invoice' | 'chat_upload' | 'manual_upload'>('all')

  // Fetch documents for student
  const { data: documentsData, isLoading, refetch } = trpc.documents.getStudentDocuments.useQuery(
    { studentId: student?.id || 0, source: sourceFilter === 'all' ? 'all' : sourceFilter },
    { enabled: !!student?.id && isOpen }
  )

  // Reset state when drawer opens with new student
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setSourceFilter('all')
    }
  }, [isOpen, student?.id])

  if (!student) return null

  const fullName = `${student.first_name} ${student.last_name}`

  // Filter documents by search query
  const filteredDocs = (documentsData?.documents || []).filter(doc => {
    if (!searchQuery) return true
    return doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="h-5 w-5 text-blue-400" />
    if (mimeType.startsWith('video/')) return <FileVideo className="h-5 w-5 text-purple-400" />
    if (mimeType.startsWith('audio/')) return <FileAudio className="h-5 w-5 text-green-400" />
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-400" />
    if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-400" />
    return <File className="h-5 w-5 text-gray-400" />
  }

  const getSourceBadge = (source: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      'waiver': { label: 'Waiver', color: 'bg-purple-500/20 text-purple-400' },
      'invoice': { label: 'Invoice', color: 'bg-green-500/20 text-green-400' },
      'receipt': { label: 'Receipt', color: 'bg-green-500/20 text-green-400' },
      'chat_upload': { label: 'Message', color: 'bg-blue-500/20 text-blue-400' },
      'manual_upload': { label: 'Training', color: 'bg-orange-500/20 text-orange-400' },
      'onboarding': { label: 'Onboarding', color: 'bg-cyan-500/20 text-cyan-400' },
    }
    const badge = badges[source] || { label: source, color: 'bg-gray-500/20 text-gray-400' }
    return <Badge className={badge.color}>{badge.label}</Badge>
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-[#0F1115] shadow-2xl z-[10000] flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Documents</h2>
            <p className="text-sm text-gray-400">{fullName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-3 border-b border-white/10 flex flex-wrap gap-2">
          {SOURCE_FILTERS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={sourceFilter === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSourceFilter(value as any)}
              className={sourceFilter === value ? 'bg-red-500 hover:bg-red-600' : 'border-white/20 hover:bg-white/10 text-gray-300'}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {label}
            </Button>
          ))}
        </div>

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredDocs.length > 0 ? (
            <div className="space-y-3">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="p-2 rounded-lg bg-white/5">
                    {getIcon(doc.mimeType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{doc.filename}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span>{formatSize(doc.sizeBytes)}</span>
                      <span>•</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      {getSourceBadge(doc.source)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {doc.mimeType === 'application/pdf' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-white/10"
                        onClick={() => window.open(doc.storageUrl, '_blank')}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4 text-gray-400" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-white/10"
                      onClick={() => {
                        const a = document.createElement('a')
                        a.href = doc.storageUrl
                        a.download = doc.filename
                        a.click()
                      }}
                      title="Download"
                    >
                      <Download className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-300">No Documents</h3>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery ? 'No documents match your search.' : 'No documents have been uploaded for this student yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center">
            {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </>
  )
}
