'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Define types for each table structure
interface VikingsFridayData {
  date: string | null
  name: string | null
  points: number | null
  games: number | null
  won: number | null
  lost: number | null
  darts_thrown: number | null
  score_left: number | null
  average: number | null
  one_eighty: number | null
  one_seventy_one: number | null
  high_closer: number | null
  winner: number
  block: string | null
  season: string | null
}

interface VikingsMatchesData {
  date: string | null
  player: string | null
  against: string | null
  legs: number | null
  ave: number | null
  result: string | null
}

interface VikingsMembersData {
  name: string | null
  surname: string | null
  member: string | null
  season: number | null
  color: string | null
}

interface JDAStatsData {
  date: string | null
  player: string | null
  bonus: number | null
  points: number | null
  games: number | null
  won: number | null
  lost: number | null
  darts: number | null
  score_left: number | null
  average: number | null
  one_eighty: number | null
  one_seventy_one: number | null
  closer: number | null
  closer1: number
  closer2: number
  block_position: number | null
  block: string | null
}

interface JDALegsData {
  date: string | null
  player: string | null
  opponent: string | null
  darts: number | null
  score_left: number | null
  result: string | null
}

interface JDAMatchesData {
  date: string | null
  player: string | null
  opponent: string | null
  legs: number | null
  ave: number | null
  result: string | null
}

interface AuthDebugInfo {
  user: unknown
  profile: { role?: string } | null
  isAdmin: boolean
  userId?: string
  email?: string
  error?: string
}

interface ParseError {
  message: string
}

// Union type for all possible processed data
type ProcessedData = VikingsFridayData | VikingsMatchesData | VikingsMembersData | JDAStatsData | JDALegsData | JDAMatchesData

const TABLE_OPTIONS = [
  // Vikings tables
  { value: 'vikings_friday', label: 'Vikings - Friday Sessions', club: 'Vikings' },
  { value: 'vikings_matches', label: 'Vikings - Matches', club: 'Vikings' },
  { value: 'vikings_members', label: 'Vikings - Members', club: 'Vikings' },
  
  // JDA tables
  { value: 'jda_stats', label: 'JDA - Main Statistics', club: 'JDA' },
  { value: 'jda_legs', label: 'JDA - Individual Legs', club: 'JDA' },
  { value: 'jda_matches', label: 'JDA - Matches', club: 'JDA' },
]

export default function CustomCSVUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [uploading, setUploading] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')
  const [preview, setPreview] = useState<Record<string, unknown>[]>([])
  const [authDebug, setAuthDebug] = useState<AuthDebugInfo | null>(null)
  
  const supabase = createClient()

  // Debug authentication - wrapped in useCallback to fix dependency warning
  const debugAuth = useCallback(async () => {
    try {
      console.log('=== Authentication Debug ===')
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('Current user:', user)
      console.log('User error:', userError)
      
      if (user) {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        console.log('User profile:', profile)
        console.log('Profile error:', profileError)
        
        setAuthDebug({
          user: user,
          profile: profile,
          isAdmin: profile?.role === 'admin',
          userId: user?.id,
          email: user?.email
        })
      } else {
        setAuthDebug({
          user: null,
          profile: null,
          isAdmin: false,
          error: 'No authenticated user'
        })
      }
      
      console.log('=== End Authentication Debug ===')
    } catch (error) {
      console.error('Auth debug error:', error)
      setAuthDebug({
        user: null,
        profile: null,
        isAdmin: false,
        error: error instanceof Error ? error.message : 'Unknown auth error'
      })
    }
  }, [supabase])

  useEffect(() => {
    debugAuth()
  }, [debugAuth])

  const detectDelimiter = (text: string): string => {
    const firstLine = text.split('\n')[0]
    if (firstLine.includes(';')) return ';'
    if (firstLine.includes(',')) return ','
    if (firstLine.includes('\t')) return '\t'
    return ','
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      
      // Read file to detect delimiter
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        const delimiter = detectDelimiter(text)
        
        console.log('Detected delimiter:', delimiter)
        
        // Parse CSV for preview with detected delimiter
        Papa.parse(selectedFile, {
          header: true,
          delimiter: delimiter,
          preview: 5,
          skipEmptyLines: true,
          complete: (results) => {
            console.log('Preview results:', results)
            setPreview(results.data as Record<string, unknown>[])
          },
          error: (error: ParseError) => {
            console.error('Preview parsing error:', error)
            setMessage(`Preview error: ${error.message}`)
          }
        })
      }
      reader.readAsText(selectedFile)
    }
  }

  const cleanValue = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    const str = String(value).trim()
    // Remove quotes if they exist
    return str.replace(/^["']|["']$/g, '')
  }

  const processVikingsFridayData = (row: Record<string, unknown>): VikingsFridayData => {
    console.log('Processing Vikings Friday row:', row)
    return {
      date: cleanValue(row.Date) || null,
      name: cleanValue(row.Name) || null,
      points: cleanValue(row.Points) ? parseInt(cleanValue(row.Points)) : null,
      games: cleanValue(row.Games) ? parseInt(cleanValue(row.Games)) : null,
      won: cleanValue(row.Won) ? parseInt(cleanValue(row.Won)) : null,
      lost: cleanValue(row.Lost) ? parseInt(cleanValue(row.Lost)) : null,
      darts_thrown: cleanValue(row.DartsThrown) ? parseInt(cleanValue(row.DartsThrown)) : null,
      score_left: cleanValue(row.ScoreLeft) ? parseInt(cleanValue(row.ScoreLeft)) : null,
      average: cleanValue(row.Average) ? parseFloat(cleanValue(row.Average)) : null,
      one_eighty: cleanValue(row['180']) ? parseInt(cleanValue(row['180'])) : null,
      one_seventy_one: cleanValue(row['171']) ? parseInt(cleanValue(row['171'])) : null,
      high_closer: cleanValue(row.HighCloser) ? parseInt(cleanValue(row.HighCloser)) : null,
      winner: cleanValue(row.Winner) ? parseInt(cleanValue(row.Winner)) : 0,
      block: cleanValue(row.Block) || null,
      season: cleanValue(row.Season) || null
    }
  }

  const processVikingsMatchesData = (row: Record<string, unknown>): VikingsMatchesData => ({
    date: cleanValue(row.Date) || null,
    player: cleanValue(row.Player) || null,
    against: cleanValue(row.Against) || null,
    legs: cleanValue(row.Legs) ? parseInt(cleanValue(row.Legs)) : null,
    ave: cleanValue(row.Ave) ? parseFloat(cleanValue(row.Ave)) : null,
    result: cleanValue(row.Result) || null
  })

  const processVikingsMembersData = (row: Record<string, unknown>): VikingsMembersData => ({
    name: cleanValue(row.Name) || null,
    surname: cleanValue(row.Surname) || null,
    member: cleanValue(row.Member) || null,
    season: cleanValue(row.Season) ? parseInt(cleanValue(row.Season)) : null,
    color: cleanValue(row.Color) || null
  })

  const processJDAStatsData = (row: Record<string, unknown>): JDAStatsData => ({
    date: cleanValue(row.Date) || null,
    player: cleanValue(row.Player) || null,
    bonus: cleanValue(row.Bonus) ? parseInt(cleanValue(row.Bonus)) : null,
    points: cleanValue(row.Points) ? parseInt(cleanValue(row.Points)) : null,
    games: cleanValue(row.Games) ? parseInt(cleanValue(row.Games)) : null,
    won: cleanValue(row.Won) ? parseInt(cleanValue(row.Won)) : null,
    lost: cleanValue(row.Lost) ? parseInt(cleanValue(row.Lost)) : null,
    darts: cleanValue(row.Darts) ? parseInt(cleanValue(row.Darts)) : null,
    score_left: cleanValue(row.ScoreLeft) ? parseInt(cleanValue(row.ScoreLeft)) : null,
    average: cleanValue(row.Average) ? parseFloat(cleanValue(row.Average)) : null,
    one_eighty: cleanValue(row['180s']) ? parseInt(cleanValue(row['180s'])) : null,
    one_seventy_one: cleanValue(row['171s']) ? parseInt(cleanValue(row['171s'])) : null,
    closer: cleanValue(row.Closer) ? parseInt(cleanValue(row.Closer)) : null,
    closer1: cleanValue(row.Closer1) ? parseInt(cleanValue(row.Closer1)) : 0,
    closer2: cleanValue(row.Closer2) ? parseInt(cleanValue(row.Closer2)) : 0,
    block_position: cleanValue(row.BlockPosition) ? parseInt(cleanValue(row.BlockPosition)) : null,
    block: cleanValue(row.Block) || null
  })

  const processJDALegsData = (row: Record<string, unknown>): JDALegsData => ({
    date: cleanValue(row.Date) || null,
    player: cleanValue(row.Player) || null,
    opponent: cleanValue(row.Opponent) || null,
    darts: cleanValue(row.Darts) ? parseInt(cleanValue(row.Darts)) : null,
    score_left: cleanValue(row.ScoreLeft) ? parseInt(cleanValue(row.ScoreLeft)) : null,
    result: cleanValue(row.Result) || null
  })

  const processJDAMatchesData = (row: Record<string, unknown>): JDAMatchesData => ({
    date: cleanValue(row.Date) || null,
    player: cleanValue(row.Player) || null,
    opponent: cleanValue(row.Opponent) || null,
    legs: cleanValue(row.Legs) ? parseInt(cleanValue(row.Legs)) : null,
    ave: cleanValue(row.Ave) ? parseFloat(cleanValue(row.Ave)) : null,
    result: cleanValue(row.Result) || null
  })

  const handleUpload = async () => {
    if (!file || !selectedTable) {
      setMessage('Please select a file and table')
      return
    }

    setUploading(true)
    setMessage('')

    // Re-check auth before upload
    await debugAuth()

    try {
      // Read file to detect delimiter
      const reader = new FileReader()
      reader.onload = async (event) => {
        const text = event.target?.result as string
        const delimiter = detectDelimiter(text)
        
        Papa.parse(text, {
          header: true,
          delimiter: delimiter,
          dynamicTyping: false, // Keep as strings initially for custom processing
          skipEmptyLines: true,
          complete: async (results) => {
            console.log('CSV parsing results:', results)
            
            if (results.errors.length > 0) {
              console.error('CSV parsing errors:', results.errors)
              setMessage(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`)
              setUploading(false)
              return
            }

            let processedData: ProcessedData[] = []

            try {
              // Process data based on selected table with proper typing
              switch (selectedTable) {
                case 'vikings_friday':
                  processedData = (results.data as Record<string, unknown>[]).map(processVikingsFridayData)
                  break
                case 'vikings_matches':
                  processedData = (results.data as Record<string, unknown>[]).map(processVikingsMatchesData)
                  break
                case 'vikings_members':
                  processedData = (results.data as Record<string, unknown>[]).map(processVikingsMembersData)
                  break
                case 'jda_stats':
                  processedData = (results.data as Record<string, unknown>[]).map(processJDAStatsData)
                  break
                case 'jda_legs':
                  processedData = (results.data as Record<string, unknown>[]).map(processJDALegsData)
                  break
                case 'jda_matches':
                  processedData = (results.data as Record<string, unknown>[]).map(processJDAMatchesData)
                  break
                default:
                  throw new Error('Invalid table selection')
              }

              console.log('Processed data sample:', processedData.slice(0, 3))

              // Filter out completely empty rows
              const filteredData = processedData.filter(row => 
                Object.values(row).some(value => value !== null && value !== '')
              )

              console.log(`Filtered data: ${filteredData.length} records`)

              if (filteredData.length === 0) {
                throw new Error('No valid data found in CSV file')
              }

              // Insert data in batches
              const batchSize = 50 // Smaller batches for better error handling
              let totalInserted = 0
              const errors: string[] = []
              
              for (let i = 0; i < filteredData.length; i += batchSize) {
                const batch = filteredData.slice(i, i + batchSize)
                console.log(`Processing batch ${Math.floor(i/batchSize) + 1}:`, batch.length, 'records')
                
                const { error } = await supabase
                  .from(selectedTable)
                  .insert(batch)
                  .select()

                if (error) {
                  console.error('Batch error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                    batch: batch.slice(0, 2) // Show first 2 records for debugging
                  })
                  
                  errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`)
                  continue // Continue with next batch
                }
                
                totalInserted += batch.length
                console.log(`Batch ${Math.floor(i/batchSize) + 1} inserted successfully`)
              }

              if (totalInserted === 0) {
                throw new Error(`Upload failed. Errors: ${errors.join(', ')}`)
              }

              let successMessage = `Successfully uploaded ${totalInserted} records to ${selectedTable}`
              if (errors.length > 0) {
                successMessage += `. Warnings: ${errors.join(', ')}`
              }
              
              setMessage(successMessage)

            } catch (processingError) {
              console.error('Data processing error:', processingError)
              throw processingError
            }
          },
          error: (error: ParseError) => {
            console.error('Papa Parse error:', error)
            setMessage(`CSV parsing error: ${error.message}`)
            setUploading(false)
          }
        })
      }
      
      reader.readAsText(file)
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setMessage(`Upload error: ${errorMessage}`)
      setUploading(false)
    }
  }

  const selectedTableInfo = TABLE_OPTIONS.find(t => t.value === selectedTable)

  return (
    <div className="space-y-6">
      {/* Authentication Debug Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Authentication Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>User ID:</span>
              <span className="font-mono">{authDebug?.userId || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span>Email:</span>
              <span>{authDebug?.email || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span>Role:</span>
              <span className={`font-semibold ${authDebug?.isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                {authDebug?.profile?.role || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Is Admin:</span>
              <span className={`font-semibold ${authDebug?.isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                {authDebug?.isAdmin ? 'Yes' : 'No'}
              </span>
            </div>
            {authDebug?.error && (
              <div className="text-red-600">
                Error: {authDebug.error}
              </div>
            )}
          </div>
          <Button onClick={debugAuth} size="sm" className="mt-3">
            Refresh Auth Status
          </Button>
        </CardContent>
      </Card>

      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold">CSV Data Upload</h2>
        <p className="text-gray-600">Upload data to Vikings or JDA club tables</p>
      </div>

      <div>
        <Label htmlFor="table-select">Select Table</Label>
        <Select value={selectedTable} onValueChange={setSelectedTable}>
          <SelectTrigger>
            <SelectValue placeholder="Choose table to upload to" />
          </SelectTrigger>
          <SelectContent>
            <div className="p-2 font-semibold text-sm text-gray-700">Vikings Club</div>
            {TABLE_OPTIONS.filter(t => t.club === 'Vikings').map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
            <div className="p-2 font-semibold text-sm text-gray-700 border-t mt-2">JDA Club</div>
            {TABLE_OPTIONS.filter(t => t.club === 'JDA').map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedTableInfo && (
          <p className="text-sm text-gray-500 mt-1">
            Club: {selectedTableInfo.club}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="csv-file">CSV File</Label>
        <Input
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-1">
          Upload a CSV file with comma (,) or semicolon (;) separators. The component will automatically detect the delimiter.
        </p>
      </div>

      {/* Expected Format Information */}
      {selectedTable && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Expected CSV Format for {selectedTableInfo?.label}</h3>
          <div className="text-sm text-blue-800">
            {selectedTable === 'vikings_friday' && (
              <p>Columns: Date, Name, Points, Games, Won, Lost, DartsThrown, ScoreLeft, Average, 180, 171, HighCloser, Winner, Block, Season</p>
            )}
            {selectedTable === 'vikings_matches' && (
              <p>Columns: Date, Player, Against, Legs, Ave, Result</p>
            )}
            {selectedTable === 'vikings_members' && (
              <p>Columns: Name, Surname, Member, Season, Color</p>
            )}
            {selectedTable === 'jda_stats' && (
              <p>Columns: Date, Player, Bonus, Points, Games, Won, Lost, Darts, ScoreLeft, Average, 180s, 171s, Closer, Closer1, Closer2, BlockPosition, Block</p>
            )}
            {selectedTable === 'jda_legs' && (
              <p>Columns: Date, Player, Opponent, Darts, ScoreLeft, Result</p>
            )}
            {selectedTable === 'jda_matches' && (
              <p>Columns: Date, Player, Opponent, Legs, Ave, Result</p>
            )}
          </div>
        </div>
      )}

      {preview.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">Preview (First 5 rows)</h3>
          <div className="overflow-x-auto bg-gray-50 p-4 rounded-lg">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  {Object.keys(preview[0]).map((key) => (
                    <th key={key} className="border border-gray-300 px-4 py-2 text-left text-xs">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="border border-gray-300 px-4 py-2 text-xs">
                        {value?.toString() || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || !selectedTable || uploading || !authDebug?.isAdmin}
        className="w-full"
        size="lg"
      >
        {uploading ? 'Uploading...' : authDebug?.isAdmin ? 'Upload CSV Data' : 'Admin Access Required'}
      </Button>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('error') || message.includes('Error') 
            ? 'bg-red-100 text-red-800 border border-red-200' 
            : 'bg-green-100 text-green-800 border border-green-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}