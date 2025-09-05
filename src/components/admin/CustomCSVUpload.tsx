'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      
      // Parse CSV for preview
      Papa.parse(selectedFile, {
        header: true,
        preview: 5,
        complete: (results) => {
          setPreview(results.data as Record<string, unknown>[])
        }
      })
    }
  }

  const processVikingsFridayData = (row: Record<string, unknown>): VikingsFridayData => ({
    date: (row.Date as string) || null,
    name: (row.Name as string) || null,
    points: row.Points ? parseInt(row.Points as string) : null,
    games: row.Games ? parseInt(row.Games as string) : null,
    won: row.Won ? parseInt(row.Won as string) : null,
    lost: row.Lost ? parseInt(row.Lost as string) : null,
    darts_thrown: row.DartsThrown ? parseInt(row.DartsThrown as string) : null,
    score_left: row.ScoreLeft ? parseInt(row.ScoreLeft as string) : null,
    average: row.Average ? parseFloat(row.Average as string) : null,
    one_eighty: row['180'] ? parseInt(row['180'] as string) : null,
    one_seventy_one: row['171'] ? parseInt(row['171'] as string) : null,
    high_closer: row.HighCloser ? parseInt(row.HighCloser as string) : null,
    winner: row.Winner ? parseInt(row.Winner as string) : 0,
    block: (row.Block as string) || null,
    season: (row.Season as string) || null
  })

  const processVikingsMatchesData = (row: Record<string, unknown>): VikingsMatchesData => ({
    date: (row.Date as string) || null,
    player: (row.Player as string) || null,
    against: (row.Against as string) || null,
    legs: row.Legs ? parseInt(row.Legs as string) : null,
    ave: row.Ave ? parseFloat(row.Ave as string) : null,
    result: (row.Result as string) || null
  })

  const processVikingsMembersData = (row: Record<string, unknown>): VikingsMembersData => ({
    name: (row.Name as string) || null,
    surname: (row.Surname as string) || null,
    member: (row.Member as string) || null,
    season: row.Season ? parseInt(row.Season as string) : null,
    color: (row.Color as string) || null
  })

  const processJDAStatsData = (row: Record<string, unknown>): JDAStatsData => ({
    date: (row.Date as string) || null,
    player: (row.Player as string) || null,
    bonus: row.Bonus ? parseInt(row.Bonus as string) : null,
    points: row.Points ? parseInt(row.Points as string) : null,
    games: row.Games ? parseInt(row.Games as string) : null,
    won: row.Won ? parseInt(row.Won as string) : null,
    lost: row.Lost ? parseInt(row.Lost as string) : null,
    darts: row.Darts ? parseInt(row.Darts as string) : null,
    score_left: row.ScoreLeft ? parseInt(row.ScoreLeft as string) : null,
    average: row.Average ? parseFloat(row.Average as string) : null,
    one_eighty: row['180s'] ? parseInt(row['180s'] as string) : null,
    one_seventy_one: row['171s'] ? parseInt(row['171s'] as string) : null,
    closer: row.Closer ? parseInt(row.Closer as string) : null,
    closer1: row.Closer1 ? parseInt(row.Closer1 as string) : 0,
    closer2: row.Closer2 ? parseInt(row.Closer2 as string) : 0,
    block_position: row.BlockPosition ? parseInt(row.BlockPosition as string) : null,
    block: (row.Block as string) || null
  })

  const processJDALegsData = (row: Record<string, unknown>): JDALegsData => ({
    date: (row.Date as string) || null,
    player: (row.Player as string) || null,
    opponent: (row.Opponent as string) || null,
    darts: row.Darts ? parseInt(row.Darts as string) : null,
    score_left: row.ScoreLeft ? parseInt(row.ScoreLeft as string) : null,
    result: (row.Result as string) || null
  })

  const processJDAMatchesData = (row: Record<string, unknown>): JDAMatchesData => ({
    date: (row.Date as string) || null,
    player: (row.Player as string) || null,
    opponent: (row.Opponent as string) || null,
    legs: row.Legs ? parseInt(row.Legs as string) : null,
    ave: row.Ave ? parseFloat(row.Ave as string) : null,
    result: (row.Result as string) || null
  })

  const handleUpload = async () => {
    if (!file || !selectedTable) {
      setMessage('Please select a file and table')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      Papa.parse(file, {
        header: true,
        dynamicTyping: false, // Keep as strings initially for custom processing
        skipEmptyLines: true,
        complete: async (results) => {
          let processedData: ProcessedData[] = []

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

          // Filter out completely empty rows
          const filteredData = processedData.filter(row => 
            Object.values(row).some(value => value !== null && value !== '')
          )

          // Insert data in batches
          const batchSize = 100
          let totalInserted = 0
          
          for (let i = 0; i < filteredData.length; i += batchSize) {
            const batch = filteredData.slice(i, i + batchSize)
            const { error } = await supabase
              .from(selectedTable)
              .insert(batch)

            if (error) {
              console.error('Batch error:', error)
              throw error
            }
            
            totalInserted += batch.length
          }

          setMessage(`Successfully uploaded ${totalInserted} records to ${selectedTable}`)
        },
        error: (error) => {
          setMessage(`CSV parsing error: ${error.message}`)
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setMessage(`Upload error: ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  const selectedTableInfo = TABLE_OPTIONS.find(t => t.value === selectedTable)

  return (
    <div className="space-y-6">
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
          Upload a CSV file with the appropriate column headers for the selected table.
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
        disabled={!file || !selectedTable || uploading}
        className="w-full"
        size="lg"
      >
        {uploading ? 'Uploading...' : 'Upload CSV Data'}
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