import { describe, it, expect } from 'vitest'
import { parseCSV } from '../lib/parse-csv'

describe('parseCSV', () => {
  it('parses a simple CSV with name column', () => {
    const csv = 'name,email,role\nAlice Smith,alice@example.com,Engineer\nBob Jones,bob@example.com,Designer'
    const result = parseCSV(csv)
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Alice Smith')
    expect(result[1].name).toBe('Bob Jones')
  })

  it('detects LinkedIn URLs', () => {
    const csv = 'name,linkedin\nJane Doe,https://linkedin.com/in/janedoe'
    const result = parseCSV(csv)
    expect(result[0].linkedinUrl).toBe('https://linkedin.com/in/janedoe')
  })

  it('returns empty for single-row CSV (header only)', () => {
    const csv = 'name,email'
    const result = parseCSV(csv)
    expect(result).toHaveLength(0)
  })

  it('handles quoted fields with commas', () => {
    const csv = 'name,bio\n"Smith, John","Loves coding, hiking"'
    const result = parseCSV(csv)
    expect(result[0].name).toBe('Smith, John')
    expect(result[0].fullText).toContain('Loves coding, hiking')
  })
})
