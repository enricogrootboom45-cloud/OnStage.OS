import { useState, useRef, type ChangeEvent } from 'react'
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { TopBar } from '../core/layout/TopBar'
import { Button } from '../core/components/Button'

interface LeadRow {
  full_name: string
  email: string
  phone: string
  source: string
}

interface ImportResult {
  inserted: number
  skipped: number
  errors: string[]
}

function parseCSV(text: string): LeadRow[] {
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []

  const rawHeaders = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ''))

  function col(aliases: string[]) {
    for (const a of aliases) {
      const i = rawHeaders.findIndex((h) => h === a || h.includes(a))
      if (i !== -1) return i
    }
    return -1
  }

  const nameIdx  = col(['full_name', 'name', 'fullname'])
  const emailIdx = col(['email'])
  const phoneIdx = col(['phone', 'mobile', 'cell'])
  const srcIdx   = col(['source', 'src', 'origin'])

  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
    return {
      full_name: nameIdx  !== -1 ? cols[nameIdx]  || '' : '',
      email:     emailIdx !== -1 ? cols[emailIdx] || '' : '',
      phone:     phoneIdx !== -1 ? cols[phoneIdx] || '' : '',
      source:    srcIdx   !== -1 ? cols[srcIdx]   || '' : 'import',
    }
  }).filter((r) => r.email || r.full_name)
}

async function batchInsert(
  orgId: string,
  rows: LeadRow[],
): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, skipped: 0, errors: [] }

  // Fetch existing emails for dedup
  const emails = rows.map((r) => r.email).filter(Boolean)
  const { data: existing } = await supabase
    .from('customers')
    .select('email')
    .eq('organization_id', orgId)
    .in('email', emails)
  const existingSet = new Set((existing || []).map((e) => e.email))

  const toInsert = rows.filter((r) => {
    if (r.email && existingSet.has(r.email)) {
      result.skipped++
      return false
    }
    return true
  })

  // Insert in batches of 200
  const BATCH = 200
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH).map((r) => ({
      organization_id: orgId,
      full_name: r.full_name || null,
      email:     r.email     || null,
      phone:     r.phone     || null,
      source:    r.source    || 'import',
    }))
    const { error, data } = await supabase.from('customers').insert(batch).select('id')
    if (error) {
      result.errors.push(`Batch ${Math.floor(i / BATCH) + 1}: ${error.message}`)
    } else {
      result.inserted += (data || []).length
    }
  }

  return result
}

export function ImportLeads() {
  const { organization } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<LeadRow[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setParseError(null)
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target?.result as string)
        if (rows.length === 0) {
          setParseError('No valid rows found. Ensure your CSV has at least a name or email column.')
          setPreview([])
        } else {
          setPreview(rows)
        }
      } catch {
        setParseError('Could not parse this file.')
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!organization || preview.length === 0) return
    setImporting(true)
    const res = await batchInsert(organization.id, preview)
    setResult(res)
    setImporting(false)
    setPreview([])
    setFileName(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      <TopBar title="Import leads" />
      <div className="p-4 lg:p-6">
        <div className="mb-6 max-w-lg rounded-lg border border-graphite-line bg-riser p-5">
          <p className="font-display text-sm font-medium text-cuesheet">Upload CSV</p>
          <p className="mt-1 text-xs text-cuesheet/45">
            Accepted columns (any order, any case):
            <span className="font-mono"> name, email, phone, source</span>
          </p>

          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-graphite-line px-4 py-8 hover:border-cuesheet/30">
            <UploadCloud size={24} className="text-cuesheet/30" />
            <span className="text-sm text-cuesheet/50">
              {fileName ? fileName : 'Click to choose a CSV file'}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="sr-only"
            />
          </label>

          {parseError && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-standby">
              <AlertTriangle size={14} /> {parseError}
            </p>
          )}
        </div>

        {/* Import result */}
        {result && (
          <div className="mb-6 max-w-lg rounded-lg border border-graphite-line bg-riser p-4">
            <p className="flex items-center gap-2 font-display text-sm font-medium text-cuesheet">
              <CheckCircle size={16} className="text-wash" /> Import complete
            </p>
            <div className="mt-3 space-y-1 text-sm">
              <p className="text-cuesheet/70">
                <span className="font-mono text-cuesheet">{result.inserted}</span> customers added
              </p>
              <p className="text-cuesheet/70">
                <span className="font-mono text-cuesheet">{result.skipped}</span> skipped (email already exists)
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 space-y-1 text-standby">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-xs">{e}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Preview table */}
        {preview.length > 0 && (
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-cuesheet/55">
                {preview.length} row{preview.length === 1 ? '' : 's'} ready to import
              </p>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? `Importing…` : `Import ${preview.length} leads`}
              </Button>
            </div>
            <div className="overflow-hidden rounded-lg border border-graphite-line">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-riser text-xs uppercase tracking-wide text-cuesheet/40">
                    <tr>
                      <th className="px-4 py-2 font-normal">Name</th>
                      <th className="px-4 py-2 font-normal">Email</th>
                      <th className="px-4 py-2 font-normal">Phone</th>
                      <th className="px-4 py-2 font-normal">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 100).map((row, i) => (
                      <tr key={i} className="border-t border-graphite-line/70">
                        <td className="px-4 py-2 text-cuesheet">{row.full_name || '—'}</td>
                        <td className="px-4 py-2 text-cuesheet/60">{row.email || '—'}</td>
                        <td className="px-4 py-2 text-cuesheet/60">{row.phone || '—'}</td>
                        <td className="px-4 py-2 text-cuesheet/45">{row.source}</td>
                      </tr>
                    ))}
                    {preview.length > 100 && (
                      <tr className="border-t border-graphite-line/70">
                        <td colSpan={4} className="px-4 py-2 text-xs text-cuesheet/35">
                          Showing first 100 rows — all {preview.length} will be imported.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
