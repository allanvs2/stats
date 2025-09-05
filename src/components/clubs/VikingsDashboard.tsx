'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface VikingsDashboardProps {
  data: {
    friday: any[]
    matches: any[]
    members: any[]
  }
}

export default function VikingsDashboard({ data }: VikingsDashboardProps) {
  // Process Friday data for charts
  const fridayChartData = useMemo(() => {
    return data.friday
      .filter(record => record.average && record.date)
      .slice(0, 20)
      .map(record => ({
        date: new Date(record.date).toLocaleDateString(),
        average: parseFloat(record.average),
        points: record.points || 0,
        games: record.games || 0,
        won: record.won || 0,
        one_eighty: record.one_eighty || 0
      }))
      .reverse()
  }, [data.friday])

  // Calculate summary stats for current user (you'd filter by current user's name)
  const summaryStats = useMemo(() => {
    const totalGames = data.friday.reduce((sum, record) => sum + (record.games || 0), 0)
    const totalWins = data.friday.reduce((sum, record) => sum + (record.won || 0), 0)
    const avgScore = data.friday.length > 0 
      ? (data.friday.reduce((sum, record) => sum + (parseFloat(record.average) || 0), 0) / data.friday.length).toFixed(2)
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
      date: new Date(match.date).toLocaleDateString()
    }))
  }, [data.matches])

  return (
    <div className="space-y-6">
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="friday">Friday Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Average Score Trend</CardTitle>
              <CardDescription>Performance over recent Friday sessions</CardDescription>
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

          <Card>
            <CardHeader>
              <CardTitle>180s and Performance</CardTitle>
              <CardDescription>180s scored over recent sessions</CardDescription>
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
          <Card>
            <CardHeader>
              <CardTitle>Recent Matches</CardTitle>
              <CardDescription>Latest match results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMatches.map((match, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">{match.player} vs {match.against}</p>
                      <p className="text-sm text-gray-600">{match.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{match.result}</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Friday Session Details</CardTitle>
              <CardDescription>Complete Friday session statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Date</th>
                      <th className="border border-gray-300 p-2 text-left">Name</th>
                      <th className="border border-gray-300 p-2 text-left">Points</th>
                      <th className="border border-gray-300 p-2 text-left">Games</th>
                      <th className="border border-gray-300 p-2 text-left">Won</th>
                      <th className="border border-gray-300 p-2 text-left">Lost</th>
                      <th className="border border-gray-300 p-2 text-left">Average</th>
                      <th className="border border-gray-300 p-2 text-left">180s</th>
                      <th className="border border-gray-300 p-2 text-left">171s</th>
                      <th className="border border-gray-300 p-2 text-left">Block</th>
                      <th className="border border-gray-300 p-2 text-left">Season</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.friday.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2">
                          {record.date ? new Date(record.date).toLocaleDateString() : '-'}
                        </td>
                        <td className="border border-gray-300 p-2">{record.name || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.points || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.games || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.won || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.lost || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.average || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.one_eighty || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.one_seventy_one || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.block || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.season || '-'}</td>
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