/**
 * Robust CSV parser and serializer for importing and exporting expenses.
 * Complies with RFC 4180 and protects against CSV formula injection.
 */

export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let insideQuotes = false

  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i]
    const nextChar = cleanText[i + 1]

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"'
        i++ // Skip next escaped quote
      } else if (char === '"') {
        insideQuotes = false
      } else {
        currentField += char
      }
    } else {
      if (char === '"') {
        insideQuotes = true
      } else if (char === ',') {
        currentRow.push(currentField.trim())
        currentField = ''
      } else if (char === '\n') {
        currentRow.push(currentField.trim())
        if (currentRow.some((f) => f.length > 0)) {
          lines.push(currentRow)
        }
        currentRow = []
        currentField = ''
      } else {
        currentField += char
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow)
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = lines[0].map((h) => h.replace(/^["']|["']$/g, '').trim())
  const rows = lines.slice(1)

  return { headers, rows }
}

/**
 * Escapes a single cell for CSV output.
 * Protects against formula injection in spreadsheets (=, +, -, @).
 */
export function escapeCSVCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""'

  let str = String(value)

  // Formula injection defense: prefix dangerous start characters with apostrophe
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`
  }

  // If contains quotes, commas, or newlines, quote and double-up quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return `"${str}"`
}

export function formatCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCSVCell).join(',')
  const rowLines = rows.map((row) => row.map(escapeCSVCell).join(','))
  return [headerLine, ...rowLines].join('\n')
}

export function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
