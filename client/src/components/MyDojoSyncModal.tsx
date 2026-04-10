/**
 * MyDojoSyncModal
 *
 * A modal that lets the user preview and import leads + students
 * from the mydojoma.com website into DojoFlow CRM.
 */

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import {
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Users,
  UserPlus,
  Loader2,
  ExternalLink,
} from 'lucide-react'

interface MyDojoSyncModalProps {
  isOpen: boolean
  onClose: () => void
  onSyncComplete?: () => void
}

export default function MyDojoSyncModal({ isOpen, onClose, onSyncComplete }: MyDojoSyncModalProps) {
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark' || theme === 'cinematic'

  const [importLeads, setImportLeads] = useState(true)
  const [importStudents, setImportStudents] = useState(true)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Preview query — runs when modal opens
  const previewQuery = trpc.myDojoSync.preview.useQuery(undefined, {
    enabled: isOpen,
    retry: 1,
  })

  // Sync mutation
  const syncMutation = trpc.myDojoSync.sync.useMutation({
    onSuccess: (data) => {
      setSyncResult(data)
      setSyncError(null)
      if (onSyncComplete) onSyncComplete()
    },
    onError: (err) => {
      setSyncError(err.message)
    },
  })

  if (!isOpen) return null

  const preview = previewQuery.data
  const isLoading = previewQuery.isLoading
  const isSyncing = syncMutation.isPending

  const bg = isDarkMode ? 'bg-[#1A1A1C]' : 'bg-white'
  const border = isDarkMode ? 'border-white/10' : 'border-slate-100'
  const text = isDarkMode ? 'text-white' : 'text-slate-800'
  const subText = isDarkMode ? 'text-white/60' : 'text-slate-500'
  const cardBg = isDarkMode ? 'bg-white/5' : 'bg-slate-50'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${bg}`}>
        {/* Header */}
        <div className={`px-6 py-5 border-b ${border} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E53935]/10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-[#E53935]" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${text}`}>Sync from MyDojo</h2>
              <p className={`text-sm ${subText}`}>Import leads & students from mydojoma.com</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${subText}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Source info */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${cardBg}`}>
            <ExternalLink className="w-4 h-4 text-[#E53935] shrink-0" />
            <div>
              <p className={`text-sm font-medium ${text}`}>mydojoma.com</p>
              <p className={`text-xs ${subText}`}>Tomball HQ — Live sync via secure API</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-500 font-medium">Connected</span>
            </div>
          </div>

          {/* Preview counts */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#E53935]" />
              <span className={`ml-3 text-sm ${subText}`}>Fetching data from MyDojo…</span>
            </div>
          ) : previewQuery.isError ? (
            <div className={`flex items-start gap-3 px-4 py-4 rounded-xl bg-red-500/10`}>
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-500">Could not connect to MyDojo</p>
                <p className={`text-xs mt-1 ${subText}`}>{previewQuery.error?.message}</p>
              </div>
            </div>
          ) : preview ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* Leads card */}
                <div
                  onClick={() => setImportLeads(!importLeads)}
                  className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all ${
                    importLeads
                      ? 'border-[#E53935] bg-[#E53935]/5'
                      : isDarkMode
                      ? 'border-white/10 bg-white/5'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <UserPlus className={`w-5 h-5 ${importLeads ? 'text-[#E53935]' : subText}`} />
                    <span className={`text-sm font-medium ${importLeads ? 'text-[#E53935]' : text}`}>
                      Intro Appointments
                    </span>
                    {importLeads && (
                      <CheckCircle className="w-4 h-4 text-[#E53935] ml-auto" />
                    )}
                  </div>
                  <p className={`text-3xl font-bold ${text}`}>{preview.counts.introAppointments}</p>
                  <p className={`text-xs mt-1 ${subText}`}>leads to import</p>

                  {/* Sample names */}
                  <div className="mt-3 space-y-1">
                    {preview.sampleLeads.slice(0, 3).map((l: any, i: number) => (
                      <div key={i} className={`text-xs truncate ${subText}`}>
                        • {l.name} — {l.program || 'Not Sure'}
                      </div>
                    ))}
                    {preview.counts.introAppointments > 3 && (
                      <p className={`text-xs ${subText}`}>
                        + {preview.counts.introAppointments - 3} more…
                      </p>
                    )}
                  </div>
                </div>

                {/* Students card */}
                <div
                  onClick={() => setImportStudents(!importStudents)}
                  className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all ${
                    importStudents
                      ? 'border-blue-500 bg-blue-500/5'
                      : isDarkMode
                      ? 'border-white/10 bg-white/5'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Users className={`w-5 h-5 ${importStudents ? 'text-blue-500' : subText}`} />
                    <span className={`text-sm font-medium ${importStudents ? 'text-blue-500' : text}`}>
                      Students
                    </span>
                    {importStudents && (
                      <CheckCircle className="w-4 h-4 text-blue-500 ml-auto" />
                    )}
                  </div>
                  <p className={`text-3xl font-bold ${text}`}>{preview.counts.students}</p>
                  <p className={`text-xs mt-1 ${subText}`}>students to import</p>

                  {/* Sample names */}
                  <div className="mt-3 space-y-1">
                    {preview.sampleStudents.slice(0, 3).map((s: any, i: number) => (
                      <div key={i} className={`text-xs truncate ${subText}`}>
                        • {s.name} — {s.beltRank || 'White Belt'}
                      </div>
                    ))}
                    {preview.counts.students > 3 && (
                      <p className={`text-xs ${subText}`}>
                        + {preview.counts.students - 3} more…
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <p className={`text-xs ${subText} text-center`}>
                Click a card to toggle import. Existing records will be updated, not duplicated.
              </p>
            </>
          ) : null}

          {/* Sync result */}
          {syncResult && (
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm font-semibold text-green-500">Sync Complete!</p>
              </div>
              <div className={`grid grid-cols-2 gap-3 text-xs ${subText}`}>
                <div>
                  <p className="font-medium mb-1">Leads</p>
                  <p>Created: <span className="text-green-400">{syncResult.leads.created}</span></p>
                  <p>Updated: <span className="text-blue-400">{syncResult.leads.updated}</span></p>
                  <p>Skipped: {syncResult.leads.skipped}</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Students</p>
                  <p>Created: <span className="text-green-400">{syncResult.students.created}</span></p>
                  <p>Updated: <span className="text-blue-400">{syncResult.students.updated}</span></p>
                  <p>Skipped: {syncResult.students.skipped}</p>
                </div>
              </div>
              {syncResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-amber-400 font-medium">Warnings ({syncResult.errors.length}):</p>
                  {syncResult.errors.slice(0, 3).map((e: string, i: number) => (
                    <p key={i} className="text-xs text-amber-400/80">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sync error */}
          {syncError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-500">Sync Failed</p>
                <p className={`text-xs mt-1 ${subText}`}>{syncError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${border} flex gap-3`}>
          <Button
            onClick={onClose}
            variant="outline"
            className={`flex-1 ${isDarkMode ? 'bg-white/5 border-white/20 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            {syncResult ? 'Close' : 'Cancel'}
          </Button>
          <Button
            onClick={() => {
              setSyncResult(null)
              setSyncError(null)
              syncMutation.mutate({ importLeads, importStudents })
            }}
            disabled={isSyncing || isLoading || previewQuery.isError || (!importLeads && !importStudents)}
            className="flex-1 bg-[#E53935] hover:bg-[#C62828] text-white"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing…
              </>
            ) : syncResult ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Again
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Import from MyDojo
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
