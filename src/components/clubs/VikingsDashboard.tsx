'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface VikingsFridayRecord {
  id: string
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
  created_at: string
}

interface VikingsMatchRecord {
  id: string
  date: string | null
  player: string | null
  against: string | null
  legs: number | null
  ave: number | null
  result: string | null
  created_at: string
}

interface VikingsMemberRecord {
  id: string
  name: string | null
  surname: string | null
  member: string | null
  season: number | null
  color: string | null
  user_id: string | null
  created_at: string
}

interface VikingsDashboardProps {
  data: {
    friday: VikingsFridayRecord[]
    matches: VikingsMatchRecord[]
    members: VikingsMemberRecord[]
  }
}

export default function VikingsDashboard({ data }: VikingsDashboardProps) {
  // Process Friday data for charts
  const fridayChartData = useMemo(() => {
    return data.friday
      .filter(record => record.average && record.date)
      .slice(0, 20)
      .map(record => ({
        date: new Date(record.date!).toLocaleDateString(),
        average: parseFloat(record.average!.toString()),
        points: record.points || 0,
        games: record.games || 0,
        won: record.won || 0,
        one_eighty: record.one_eighty || 0
      }))
      .reverse()
  }, [data.friday])

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalGames = data.friday.reduce((sum, record) => sum + (record.games || 0), 0)
    const totalWins = data.friday.reduce((sum, record) => sum + (record.won || 0), 0)
    const avgScore = data.friday.length > 0 
      ? (data.friday.reduce((sum, record) => sum + (parseFloat(record.average?.toString() || '0') || 0), 0) / data.friday.length).toFixed(2)
      : '0.00'
    const total180s = data.friday.reduce((sum, record) => sum + (record.one_eighty || 0), 0)
    const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : '0'

    return {
      totalGames,
      totalWins,
      avgScore,
      total180s,
      winRate
    }
  }, [data.friday])

  // Process match results
  const recentMatches = useMemo(() => {
    return data.matches.slice(0, 10).map(match => ({
      ...match,
      date: match.date ? new Date(match.date).toLocaleDateString() : 'Unknown'
    }))
  }, [data.matches])

  return (
    <div className="bg-gray-200 rounded-lg space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Vikings Dart Club</h1>
        <p className="text-gray-600">Performance statistics and match history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Games</CardDescription>
            <CardTitle className="text-2xl">{summaryStats.totalGames}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Win Rate</CardDescription>
            <CardTitle className="text-2xl">{summaryStats.winRate}%</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Score</CardDescription>
            <CardTitle className="text-2xl">{summaryStats.avgScore}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total 180s</CardDescription>
            <CardTitle className="text-2xl">{summaryStats.total180s}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Wins</CardDescription>
            <CardTitle className="text-2xl">{summaryStats.totalWins}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="friday">Friday Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Average Score Trend</CardTitle>
                <CardDescription className="text-gray-600">Performance over recent Friday sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={fridayChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="average" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">180s and Performance</CardTitle>
                <CardDescription className="text-gray-600">180s scored over recent sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={fridayChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="one_eighty" fill="#82ca9d" name="180s" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="matches">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Recent Matches</CardTitle>
                <CardDescription className="text-gray-600">Latest match results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentMatches.map((match, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div>
                        <p className="font-semibold text-gray-900">{match.player} vs {match.against}</p>
                        <p className="text-sm text-gray-600">{match.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{match.result}</p>
                        <p className="text-sm text-gray-600">Avg: {match.ave}</p>
                        <p className="text-sm text-gray-600">Legs: {match.legs}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="friday">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Friday Session Details</CardTitle>
                <CardDescription className="text-gray-600">Complete Friday session statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left text-gray-900">Date</th>
                        <th className="border border-gray-300 p-2 text-left text-gray-900">Name</th>
                        <th className="border border-gray-300 p-2 text-left text-gray-900">Points</th>
                        <th className="border border-gray-300 p-2 text-left text-gray-900">Games</th>
                        <th className="border border-gray-300 p-2 text-left text-gray-900">Won</th>
                        <th className="border border-gray-300 p-2 text-left text-gray-900">Lost</th>
                        <th className="border border-gray-300 p-2 text-left text-gray-900">Average</th>
                        <th className="border border-gray-300 p-2 text-left text-gray-900">180s</th>
                        <th className="border border-gray-300 p-2 text-left text-gray-900">171s</th>
                        <th className="border border-gray-300 p-2 text-left text-gray-900">Block</th>
                        <th className="border border-gray-300 p-2 text-left text-gray-900">Season</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.friday.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 text-gray-900">
                            {record.date ? new Date(record.date).toLocaleDateString() : '-'}
                          </td>
                          <td className="border border-gray-300 p-2 text-gray-900">{record.name || '-'}</td>
                          <td className="border border-gray-300 p-2 text-gray-900">{record.points || '-'}</td>
                          <td className="border border-gray-300 p-2 text-gray-900">{record.games || '-'}</td>
                          <td className="border border-gray-300 p-2 text-gray-900">{record.won || '-'}</td>
                          <td className="border border-gray-300 p-2 text-gray-900">{record.lost || '-'}</td>
                          <td className="border border-gray-300 p-2 text-gray-900">{record.average || '-'}</td>
                          <td className="border border-gray-300 p-2 text-gray-900">{record.one_eighty || '-'}</td>
                          <td className="border border-gray-300 p-2 text-gray-900">{record.one_seventy_one || '-'}</td>
                          <td className="border border-gray-300 p-2 text-gray-900">{record.block || '-'}</td>
                          <td className="border border-gray-300 p-2 text-gray-900">{record.season || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  )
}