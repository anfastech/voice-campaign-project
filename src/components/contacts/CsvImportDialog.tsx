'use client'

import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react'

interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CsvImportDialog({ open, onOpenChange }: CsvImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/contacts/import', { method: 'POST', body: formData })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  const handleFileChange = (f: File) => {
    if (f.name.endsWith('.csv')) setFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileChange(f)
  }

  const handleImport = () => {
    if (file) importMutation.mutate(file)
  }

  const handleClose = () => {
    setFile(null)
    importMutation.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: <code className="font-mono">phone_number</code>, <code className="font-mono">name</code>, <code className="font-mono">email</code>, <code className="font-mono">tags</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {importMutation.isSuccess ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'oklch(0.55 0.215 163)' }} />
              <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Import Complete!</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {(importMutation.data as any)?.imported} contacts imported
                {(importMutation.data as any)?.failed > 0 && `, ${(importMutation.data as any)?.failed} failed`}
              </p>
              <button
                className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                  boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
                }}
                onClick={handleClose}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200"
                style={{
                  borderColor: isDragging ? 'oklch(0.49 0.263 281)' : 'var(--border)',
                  background: isDragging ? 'oklch(0.49 0.263 281 / 8%)' : 'var(--muted)',
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />
                {file ? (
                  <>
                    <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: 'oklch(0.49 0.263 281)' }} />
                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>{file.name}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{(file.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--muted-foreground)' }} />
                    <p style={{ color: 'var(--foreground)' }}>Drop your CSV file here</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>or click to browse</p>
                  </>
                )}
              </div>

              <div
                className="rounded-xl p-3 text-xs"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
              >
                <p className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>Expected CSV format:</p>
                <code className="font-mono">phone_number,name,email,tags</code>
                <br />
                <code className="font-mono">+15551234567,John Smith,john@example.com,lead</code>
              </div>

              {importMutation.isError && (
                <div
                  className="flex items-center gap-2 text-sm rounded-xl px-4 py-3"
                  style={{
                    background: 'oklch(0.59 0.245 15 / 8%)',
                    border: '1px solid oklch(0.59 0.245 15 / 20%)',
                    color: 'oklch(0.59 0.245 15)',
                  }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Import failed. Please check your CSV format.
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-105"
                  style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--muted)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!file || importMutation.isPending}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                    boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
                  }}
                >
                  {importMutation.isPending ? 'Importing...' : 'Import Contacts'}
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
