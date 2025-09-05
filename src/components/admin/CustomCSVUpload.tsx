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
  const [preview, setPreview] = useState<any[]>([])
  
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
          setPreview(results.data)
        }
      })
    }
  }

  const processVikingsFridayData = (row: any): VikingsFridayData => ({
    date: row.Date || null,
    name: row.Name || null,
    points: parseInt(row.Points) || null,
    games: parseInt(row.Games) || null,
    won: parseInt(row.Won) || null,
    lost: parseInt(row.Lost) || null,
    darts_thrown: parseInt(row.DartsThrown) || null,
    score_left: parseInt(row.ScoreLeft) || null,
    average: parseFloat(row.Average) || null,
    one_eighty: parseInt(row['180']) || null,
    one_seventy_one: parseInt(row['171']) || null,
    high_closer: parseInt(row.HighCloser) || null,
    winner: parseInt(row.Winner) || 0,
    block: row.Block || null,
    season: row.Season || null
  })

  const processVikingsMatchesData = (row: any): VikingsMatchesData => ({
    date: row.Date || null,
    player: row.Player || null,
    against: row.Against || null,
    legs: parseInt(row.Legs) || null,
    ave: parseFloat(row.Ave) || null,
    result: row.Result || null
  })

  const processVikingsMembersData = (row: any): VikingsMembersData => ({
    name: row.Name || null,
    surname: row.Surname || null,
    member: row.Member || null,
    season: parseInt(row.Season) || null,
    color: row.Color || null
  })

  const processJDAStatsData = (row: any): JDAStatsData => ({
    date: row.Date || null,
    player: row.Player || null,
    bonus: parseInt(row.Bonus) || null,
    points: parseInt(row.Points) || null,
    games: parseInt(row.Games) || null,
    won: parseInt(row.Won) || null,
    lost: parseInt(row.Lost) || null,
    darts: parseInt(row.Darts) || null,
    score_left: parseInt(row.ScoreLeft) || null,
    average: parseFloat(row.Average) || null,
    one_eighty: parseInt(row['180s']) || null,
    one_seventy_one: parseInt(row['171s']) || null,
    closer: parseInt(row.Closer) || null,
    closer1: parseInt(row.Closer1) || 0,
    closer2: parseInt(row.Closer2) || 0,
    block_position: parseInt(row.BlockPosition) || null,
    block: row.Block || null
  })

  const processJDALegsData = (row: any): JDALegsData => ({
    date: row.Date || null,
    player: row.Player || null,
    opponent: row.Opponent || null,
    darts: parseInt(row.Darts) || null,
    score_left: parseInt(row.ScoreLeft) || null,
    result: row.Result || null
  })

  const processJDAMatchesData = (row: any): JDAMatchesData => ({
    date: row.Date || null,
    player: row.Player || null,
    opponent: row.Opponent || null,
    legs: parseInt(row.Legs) || null,
    ave: parseFloat(row.Ave) || null,
    result: row.Result || null
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
              processedData = results.data.map(processVikingsFridayData)
              break
            case 'vikings_matches':
              processedData = results.data.map(processVikingsMatchesData)
              break
            case 'vikings_members':
              processedData = results.data.map(processVikingsMembersData)
              break
            case 'jda_stats':
              processedData = results.data.map(processJDAStatsData)
              break
            case 'jda_legs':
              processedData = results.data.map(processJDALegsData)
              break
            case 'jda_matches':
              processedData = results.data.map(processJDAMatchesData)
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
            const { error, data } = await supabase
              .from(selectedTable)
              .insert(batch)
              .select()

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
    } catch (error: any) {
      setMessage(`Upload error: ${error.message}`)
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
                    {Object.values(row).map((value: any, cellIndex) => (
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