'use client'

import { useState, useRef } from 'react'
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  FileCheck,
  Calendar,
} from 'lucide-react'
import { parseCSV, formatCSV, downloadBlob } from '@/lib/utils/csv'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toaster'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/FormFields'
import type { Category, Tag } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

interface ImportExportClientProps {
  categories: Category[]
  tags: Tag[]
  defaultCurrency: string
}

type TabType = 'export' | 'import'

interface ColumnMapping {
  title: string
  amount: string
  currency: string
  category: string
  date: string
  merchant: string
  payment_method: string
  notes: string
  tags: string
}

interface ParsedExpenseRow {
  index: number
  title: string
  amount: number
  currency: string
  categoryName?: string
  date: string
  merchant?: string
  paymentMethod?: string
  notes?: string
  tagNames: string[]
  isValid: boolean
  error?: string
  isDuplicate?: boolean
}

export function ImportExportClient({
  categories,
  tags,
  defaultCurrency,
}: ImportExportClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('export')
  const { success, error: toastError, warning } = useToast()

  // --- EXPORT STATE ---
  const [exportRange, setExportRange] = useState<'all' | 'this_month' | 'last_month' | 'this_year'>('all')
  const [isExporting, setIsExporting] = useState(false)

  // --- IMPORT STATE ---
  const [importStep, setImportStep] = useState<1 | 2 | 3 | 4>(1)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRawRows, setCsvRawRows] = useState<string[][]>([])
  const [fileName, setFileName] = useState('')
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    title: '',
    amount: '',
    currency: '',
    category: '',
    date: '',
    merchant: '',
    payment_method: '',
    notes: '',
    tags: '',
  })
  const [previewRows, setPreviewRows] = useState<ParsedExpenseRow[]>([])
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [importReport, setImportReport] = useState<{
    total: number
    imported: number
    skipped: number
    failed: number
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ==========================================
  // EXPORT HANDLERS
  // ==========================================
  async function handleExportCSV() {
    setIsExporting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let query = supabase
        .from('expenses')
        .select(`
          id,
          title,
          amount,
          currency,
          transaction_date,
          merchant,
          payment_method,
          notes,
          categories (name),
          expense_tags (tags (name))
        `)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })

      const now = new Date()
      if (exportRange === 'this_month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        query = query.gte('transaction_date', start)
      } else if (exportRange === 'last_month') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
        const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
        query = query.gte('transaction_date', start).lte('transaction_date', end)
      } else if (exportRange === 'this_year') {
        const start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
        query = query.gte('transaction_date', start)
      }

      const { data, error } = await query
      if (error) throw error

      if (!data || data.length === 0) {
        warning('No transactions found for the selected export timeframe.')
        setIsExporting(false)
        return
      }

      const headers = [
        'Date',
        'Title',
        'Amount',
        'Currency',
        'Category',
        'Merchant',
        'Payment Method',
        'Tags',
        'Notes',
      ]

      const rows = data.map((exp: any) => {
        const categoryName = exp.categories?.name ?? ''
        const tagNames = (exp.expense_tags ?? [])
          .map((et: any) => et.tags?.name)
          .filter(Boolean)
          .join('; ')

        return [
          exp.transaction_date,
          exp.title,
          exp.amount,
          exp.currency,
          categoryName,
          exp.merchant ?? '',
          exp.payment_method ?? '',
          tagNames,
          exp.notes ?? '',
        ]
      })

      const csvContent = formatCSV(headers, rows)
      const dateTag = new Date().toISOString().split('T')[0]
      downloadBlob(csvContent, `expenses-export-${dateTag}.csv`, 'text/csv;charset=utf-8;')
      success(`Exported ${data.length} transactions successfully`)
    } catch (err: any) {
      toastError(err.message || 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportJSON() {
    setIsExporting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const [expensesRes, categoriesRes, tagsRes] = await Promise.all([
        supabase
          .from('expenses')
          .select(`*, expense_tags (tag_id)`)
          .eq('user_id', user.id),
        supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('tags')
          .select('*')
          .eq('user_id', user.id),
      ])

      const backup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        user: { id: user.id, email: user.email },
        categories: categoriesRes.data ?? [],
        tags: tagsRes.data ?? [],
        expenses: expensesRes.data ?? [],
      }

      const jsonStr = JSON.stringify(backup, null, 2)
      const dateTag = new Date().toISOString().split('T')[0]
      downloadBlob(jsonStr, `spendly-backup-${dateTag}.json`, 'application/json;charset=utf-8;')
      success('Full account JSON backup downloaded successfully')
    } catch (err: any) {
      toastError(err.message || 'Backup failed')
    } finally {
      setIsExporting(false)
    }
  }

  // ==========================================
  // IMPORT HANDLERS
  // ==========================================
  function handleFileSelect(file: File) {
    if (!file.name.endsWith('.csv')) {
      toastError('Please select a valid .csv file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toastError('File size exceeds the 5MB limit')
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers, rows } = parseCSV(text)

      if (headers.length === 0 || rows.length === 0) {
        toastError('The selected CSV file appears to be empty')
        return
      }

      setCsvHeaders(headers)
      setCsvRawRows(rows)

      // Auto-guess column mappings based on common header names
      const mapping: ColumnMapping = {
        title: '',
        amount: '',
        currency: '',
        category: '',
        date: '',
        merchant: '',
        payment_method: '',
        notes: '',
        tags: '',
      }

      headers.forEach((h) => {
        const lower = h.toLowerCase()
        if (/date|time|timestamp/.test(lower) && !mapping.date) mapping.date = h
        else if (/title|description|name|expense/.test(lower) && !mapping.title) mapping.title = h
        else if (/amount|cost|price|total|value/.test(lower) && !mapping.amount) mapping.amount = h
        else if (/currency|curr/.test(lower) && !mapping.currency) mapping.currency = h
        else if (/category|cat/.test(lower) && !mapping.category) mapping.category = h
        else if (/merchant|payee|vendor|store/.test(lower) && !mapping.merchant) mapping.merchant = h
        else if (/payment|method|type/.test(lower) && !mapping.payment_method) mapping.payment_method = h
        else if (/note|memo|comment/.test(lower) && !mapping.notes) mapping.notes = h
        else if (/tag|tags|label/.test(lower) && !mapping.tags) mapping.tags = h
      })

      setColumnMapping(mapping)
      setImportStep(2)
    }
    reader.readAsText(file)
  }

  function handleProcessMappings() {
    if (!columnMapping.title || !columnMapping.amount || !columnMapping.date) {
      toastError('Date, Title, and Amount mappings are required to proceed.')
      return
    }

    const titleIdx = csvHeaders.indexOf(columnMapping.title)
    const amountIdx = csvHeaders.indexOf(columnMapping.amount)
    const dateIdx = csvHeaders.indexOf(columnMapping.date)
    const currIdx = columnMapping.currency ? csvHeaders.indexOf(columnMapping.currency) : -1
    const catIdx = columnMapping.category ? csvHeaders.indexOf(columnMapping.category) : -1
    const merchIdx = columnMapping.merchant ? csvHeaders.indexOf(columnMapping.merchant) : -1
    const pmIdx = columnMapping.payment_method ? csvHeaders.indexOf(columnMapping.payment_method) : -1
    const notesIdx = columnMapping.notes ? csvHeaders.indexOf(columnMapping.notes) : -1
    const tagsIdx = columnMapping.tags ? csvHeaders.indexOf(columnMapping.tags) : -1

    const parsed: ParsedExpenseRow[] = csvRawRows.map((row, index) => {
      const rawTitle = row[titleIdx]?.trim() || ''
      const rawAmountStr = row[amountIdx]?.replace(/[^0-9.-]/g, '') || ''
      const rawDateStr = row[dateIdx]?.trim() || ''

      let amount = parseFloat(rawAmountStr)
      let isValid = true
      let error = ''

      if (!rawTitle) {
        isValid = false
        error = 'Missing title'
      } else if (isNaN(amount) || amount <= 0) {
        isValid = false
        error = 'Invalid amount'
      }

      // Normalize date to YYYY-MM-DD
      let normalizedDate = ''
      try {
        const d = new Date(rawDateStr)
        if (isNaN(d.getTime())) {
          isValid = false
          error = 'Invalid date'
        } else {
          normalizedDate = d.toISOString().split('T')[0]
        }
      } catch {
        isValid = false
        error = 'Invalid date'
      }

      const currency = currIdx >= 0 && row[currIdx] ? row[currIdx].trim().toUpperCase() : defaultCurrency
      const categoryName = catIdx >= 0 ? row[catIdx]?.trim() : undefined
      const merchant = merchIdx >= 0 ? row[merchIdx]?.trim() : undefined
      const paymentMethod = pmIdx >= 0 ? row[pmIdx]?.trim() : undefined
      const notes = notesIdx >= 0 ? row[notesIdx]?.trim() : undefined
      const rawTags = tagsIdx >= 0 && row[tagsIdx] ? row[tagsIdx].split(/[,;]/).map((t) => t.trim().toLowerCase()).filter(Boolean) : []

      return {
        index: index + 1,
        title: rawTitle,
        amount: Math.abs(amount) || 0,
        currency,
        categoryName,
        date: normalizedDate,
        merchant,
        paymentMethod,
        notes,
        tagNames: rawTags,
        isValid,
        error,
      }
    })

    setPreviewRows(parsed)
    setImportStep(3)
  }

  async function handleExecuteImport() {
    setIsImporting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toastError('Session expired. Please log in.')
      setIsImporting(false)
      return
    }

    // Existing expenses for duplicate checking (same date, title, amount)
    const { data: existingExpenses } = await supabase
      .from('expenses')
      .select('title, amount, transaction_date')
      .eq('user_id', user.id)

    const existingKeys = new Set(
      (existingExpenses ?? []).map((e) => `${e.transaction_date}|${e.title.toLowerCase()}|${Number(e.amount)}`)
    )

    let importedCount = 0
    let skippedCount = 0
    let failedCount = 0

    // Build map of category names to IDs (case-insensitive)
    const catMap = new Map<string, string>()
    categories.forEach((c) => catMap.set(c.name.toLowerCase(), c.id))

    // Build map of tag names to IDs
    const tagMap = new Map<string, string>()
    tags.forEach((t) => tagMap.set(t.name.toLowerCase(), t.id))

    for (const row of previewRows) {
      if (!row.isValid) {
        failedCount++
        continue
      }

      const key = `${row.date}|${row.title.toLowerCase()}|${Number(row.amount)}`
      if (skipDuplicates && existingKeys.has(key)) {
        skippedCount++
        continue
      }

      // Check category match
      let categoryId: string | null = null
      if (row.categoryName && catMap.has(row.categoryName.toLowerCase())) {
        categoryId = catMap.get(row.categoryName.toLowerCase())!
      }

      // Insert expense
      const { data: inserted, error: insertError } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          title: row.title,
          amount: row.amount,
          currency: row.currency || defaultCurrency,
          category_id: categoryId,
          transaction_date: row.date,
          merchant: row.merchant || null,
          payment_method: (row.paymentMethod?.toLowerCase().replace(/\s+/g, '_') as any) || null,
          notes: row.notes || null,
        })
        .select('id')
        .single()

      if (insertError || !inserted) {
        failedCount++
        continue
      }

      // Handle tags
      if (row.tagNames.length > 0) {
        for (const tagName of row.tagNames) {
          let tagId = tagMap.get(tagName)
          if (!tagId) {
            // Auto-create tag
            const { data: newTag } = await supabase
              .from('tags')
              .insert({ user_id: user.id, name: tagName, color: '#0066cc' })
              .select('id')
              .single()
            if (newTag) {
              tagId = newTag.id
              tagMap.set(tagName, tagId)
            }
          }

          if (tagId) {
            await supabase
              .from('expense_tags')
              .insert({ expense_id: inserted.id, tag_id: tagId })
          }
        }
      }

      importedCount++
      existingKeys.add(key)
    }

    setIsImporting(false)
    setImportReport({
      total: previewRows.length,
      imported: importedCount,
      skipped: skippedCount,
      failed: failedCount,
    })
    setImportStep(4)
    success(`Successfully imported ${importedCount} expenses`)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Import & Export
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          Migrate your transactions or back up your financial records anytime
        </p>
      </div>

      {/* Tabs */}
      <div className="segmented-control w-fit">
        <button
          onClick={() => setActiveTab('export')}
          className={cn(
            'segmented-item flex items-center gap-2',
            activeTab === 'export' && 'active'
          )}
        >
          <Download className="w-3.5 h-3.5" />
          Export Data
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={cn(
            'segmented-item flex items-center gap-2',
            activeTab === 'import' && 'active'
          )}
        >
          <Upload className="w-3.5 h-3.5" />
          Import CSV
        </button>
      </div>

      {/* ==================== EXPORT TAB ==================== */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* CSV Export Card */}
          <div className="apple-card p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center"
                  style={{ background: 'var(--color-surface-secondary)' }}
                >
                  <FileSpreadsheet className="w-5 h-5 text-[var(--color-text-primary)]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Export to CSV Spreadsheet
                  </h2>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Compatible with Excel, Numbers, and Google Sheets
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Timeframe</label>
                <Select
                  value={exportRange}
                  onChange={(e) => setExportRange(e.target.value as any)}
                >
                  <option value="all">All Time (Complete History)</option>
                  <option value="this_month">Current Month</option>
                  <option value="last_month">Previous Month</option>
                  <option value="this_year">Current Year</option>
                </Select>
              </div>

              <div className="flex flex-col justify-end">
                <Button
                  onClick={handleExportCSV}
                  loading={isExporting}
                  className="w-full sm:w-auto self-start"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </Button>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--color-surface-secondary)] text-xs text-[var(--color-text-secondary)] space-y-1">
              <span className="font-semibold text-[var(--color-text-primary)] block">Included CSV Fields:</span>
              <p>Date, Title, Amount, Currency, Category, Merchant, Payment Method, Associated Tags, Notes.</p>
              <p className="text-[var(--color-text-tertiary)]">Formula-injection prevention enabled to protect spreadsheet security.</p>
            </div>
          </div>

          {/* JSON Backup Card */}
          <div className="apple-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center"
                style={{ background: 'var(--color-surface-secondary)' }}
              >
                <FileJson className="w-5 h-5 text-[var(--color-text-primary)]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Complete JSON Data Backup
                </h2>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  Full relational snapshot including custom categories and tags
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--color-text-secondary)]">
              Creates a raw, structured JSON file of your entire account dataset. Ideal for developer
              backups and data porting.
            </p>

            <div>
              <Button
                variant="secondary"
                onClick={handleExportJSON}
                loading={isExporting}
              >
                <Download className="w-4 h-4" />
                Download JSON Backup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== IMPORT TAB ==================== */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Step 1: Upload */}
          {importStep === 1 && (
            <div className="apple-card p-8 text-center space-y-4">
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{ background: 'var(--color-fill-secondary)' }}
              >
                <Upload className="w-8 h-8 text-[var(--color-accent)]" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Select CSV File to Import
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-md mx-auto">
                  Upload a CSV file containing your expenses. In the next step you will be able to map
                  the file columns to Spendly fields.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />

              <div className="pt-2">
                <Button onClick={() => fileInputRef.current?.click()}>
                  Browse CSV File
                </Button>
              </div>

              <p className="text-xs text-[var(--color-text-tertiary)] pt-2">
                Supported format: CSV (comma-separated values), maximum 5 MB
              </p>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {importStep === 2 && (
            <div className="apple-card p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Map Columns ({fileName})
                  </h2>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Match each Spendly field to the corresponding column header in your CSV file
                  </p>
                </div>
                <span className="text-xs text-[var(--color-accent)] font-semibold bg-[var(--color-accent)]/10 px-2.5 py-1 rounded-full">
                  Step 2 of 4
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Transaction Date *"
                  value={columnMapping.date}
                  onChange={(e) => setColumnMapping({ ...columnMapping, date: e.target.value })}
                >
                  <option value="">Select column...</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </Select>

                <Select
                  label="Title / Description *"
                  value={columnMapping.title}
                  onChange={(e) => setColumnMapping({ ...columnMapping, title: e.target.value })}
                >
                  <option value="">Select column...</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </Select>

                <Select
                  label="Amount *"
                  value={columnMapping.amount}
                  onChange={(e) => setColumnMapping({ ...columnMapping, amount: e.target.value })}
                >
                  <option value="">Select column...</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </Select>

                <Select
                  label="Currency (Optional)"
                  value={columnMapping.currency}
                  onChange={(e) => setColumnMapping({ ...columnMapping, currency: e.target.value })}
                >
                  <option value="">None (Use default: {defaultCurrency})</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </Select>

                <Select
                  label="Category (Optional)"
                  value={columnMapping.category}
                  onChange={(e) => setColumnMapping({ ...columnMapping, category: e.target.value })}
                >
                  <option value="">None</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </Select>

                <Select
                  label="Merchant / Payee (Optional)"
                  value={columnMapping.merchant}
                  onChange={(e) => setColumnMapping({ ...columnMapping, merchant: e.target.value })}
                >
                  <option value="">None</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </Select>

                <Select
                  label="Payment Method (Optional)"
                  value={columnMapping.payment_method}
                  onChange={(e) => setColumnMapping({ ...columnMapping, payment_method: e.target.value })}
                >
                  <option value="">None</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </Select>

                <Select
                  label="Tags (Optional)"
                  value={columnMapping.tags}
                  onChange={(e) => setColumnMapping({ ...columnMapping, tags: e.target.value })}
                >
                  <option value="">None</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </Select>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                <Button variant="secondary" onClick={() => setImportStep(1)}>
                  Back
                </Button>
                <Button onClick={handleProcessMappings}>
                  <span>Preview & Validate</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preview & Validate */}
          {importStep === 3 && (
            <div className="apple-card p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Validation & Preview ({previewRows.length} rows)
                  </h2>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Verify normalized records before importing into your database
                  </p>
                </div>
                <span className="text-xs text-[var(--color-accent)] font-semibold bg-[var(--color-accent)]/10 px-2.5 py-1 rounded-full">
                  Step 3 of 4
                </span>
              </div>

              {/* Duplicate Handling Option */}
              <div className="flex items-center gap-3 p-3.5 rounded-lg bg-[var(--color-fill-secondary)]">
                <input
                  type="checkbox"
                  id="skip-dup"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                />
                <label htmlFor="skip-dup" className="text-xs text-[var(--color-text-primary)] cursor-pointer">
                  <strong>Skip potential duplicate transactions</strong> (matches identical date, title, and amount)
                </label>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto max-h-80 border border-[var(--color-border)] rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--color-fill-secondary)] text-[var(--color-text-secondary)] font-semibold sticky top-0">
                    <tr>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Title</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {previewRows.slice(0, 50).map((row) => (
                      <tr key={row.index} className={row.isValid ? '' : 'bg-[var(--color-error)]/5'}>
                        <td className="p-2.5">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[var(--color-error)] font-medium">
                              <AlertCircle className="w-3.5 h-3.5" /> {row.error}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">{row.date || '—'}</td>
                        <td className="p-2.5 font-medium">{row.title}</td>
                        <td className="p-2.5">{row.currency} {row.amount}</td>
                        <td className="p-2.5">{row.categoryName || '—'}</td>
                        <td className="p-2.5">{row.tagNames.join(', ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {previewRows.length > 50 && (
                <p className="text-xs text-[var(--color-text-tertiary)] text-center">
                  Showing first 50 rows of {previewRows.length} total rows
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                <Button variant="secondary" onClick={() => setImportStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={handleExecuteImport}
                  loading={isImporting}
                  id="btn-confirm-import"
                >
                  Import {previewRows.filter((r) => r.isValid).length} Transactions
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Completion Report */}
          {importStep === 4 && importReport && (
            <div className="apple-card p-8 text-center space-y-6">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                  Import Completed
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Your expenses have been processed and saved to your account.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="p-4 rounded-xl bg-[var(--color-fill-secondary)]">
                  <span className="text-2xl font-bold text-emerald-600 block">
                    {importReport.imported}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">Imported</span>
                </div>
                <div className="p-4 rounded-xl bg-[var(--color-fill-secondary)]">
                  <span className="text-2xl font-bold text-[var(--color-text-secondary)] block">
                    {importReport.skipped}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">Duplicates Skipped</span>
                </div>
                <div className="p-4 rounded-xl bg-[var(--color-fill-secondary)]">
                  <span className="text-2xl font-bold text-[var(--color-error)] block">
                    {importReport.failed}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">Invalid Rows</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setImportStep(1)
                    setImportReport(null)
                    setPreviewRows([])
                  }}
                >
                  Import Another File
                </Button>
                <Button onClick={() => window.location.href = '/expenses'}>
                  View Expenses
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
