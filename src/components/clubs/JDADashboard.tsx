'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface JDADashboardProps {
  data: {
    stats: any[]
    legs: any[]
    matches: any[]
  }
}

export default function JDADashboard({ data }: JDADashboardProps) {
  // Process stats data for charts
  const statsChartData = useMemo(() => {
    return data.stats
      .filter(record => record.average && record.date)
      .slice(0, 20)
      .map(record => ({
        date: new Date(record.date).toLocaleDateString(),
        average: parseFloat(record.average),
        points: record.points || 0,
        games: record.games || 0,
        won: record.won || 0,
        lost: record.lost || 0,
        one_eighty: record.one_eighty || 0,
        bonus: record.bonus || 0
      }))
      .reverse()
  }, [data.stats])

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalGames = data.stats.reduce((sum, record) => sum + (record.games || 0), 0)
    const totalWins = data.stats.reduce((sum, record) => sum + (record.won || 0), 0)
    const totalLost = data.stats.reduce((sum, record) => sum + (record.lost || 0), 0)
    const totalPoints = data.stats.reduce((sum, record) => sum + (record.points || 0), 0)
    const totalBonus = data.stats.reduce((sum, record) => sum + (record.bonus || 0), 0)
    const avgScore = data.stats.length > 0 
      ? (data.stats.reduce((sum, record) => sum + (parseFloat(record.average) || 0), 0) / data.stats.length).toFixed(2)
      : '0.00'
    const total180s = data.stats.reduce((sum, record) => sum + (record.one_eighty || 0), 0)
    const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : '0'

    return {
      totalGames,
      totalWins,
      totalLost,
      totalPoints,
      totalBonus,
      avgScore,
      total180s,
      winRate
    }
  }, [data.stats])

  // Process recent matches
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
        <h1 className="text-3xl font-bold text-gray-900">JDA Dart Club</h1>
        <p className="text-gray-600">Performance statistics and match history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
            <CardDescription>Total Points</CardDescription>
            <CardTitle className="text-2xl">{summaryStats.totalPoints}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bonus Points</CardDescription>
            <CardTitle className="text-2xl">{summaryStats.totalBonus}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total 180s</CardDescription>
            <CardTitle className="text-2xl">{summaryStats.total180s}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="legs">Legs</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Average Score & Points Trend</CardTitle>
              <CardDescription>Performance over recent sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={statsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="average" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Average"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="points" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Points"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Games Won vs Lost</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={statsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="won" fill="#82ca9d" name="Won" />
                    <Bar dataKey="lost" fill="#ff7c7c" name="Lost" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>180s & Bonus Points</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={statsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="one_eighty" fill="#8884d8" name="180s" />
                    <Bar dataKey="bonus" fill="#ffc658" name="Bonus" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
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
                      <p className="font-semibold">{match.player} vs {match.opponent}</p>
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
        
        <TabsContent value="legs">
          <Card>
            <CardHeader>
              <CardTitle>Individual Legs</CardTitle>
              <CardDescription>Detailed leg-by-leg performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Date</th>
                      <th className="border border-gray-300 p-2 text-left">Player</th>
                      <th className="border border-gray-300 p-2 text-left">Opponent</th>
                      <th className="border border-gray-300 p-2 text-left">Darts</th>
                      <th className="border border-gray-300 p-2 text-left">Score Left</th>
                      <th className="border border-gray-300 p-2 text-left">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.legs.slice(0, 50).map((leg, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2">
                          {leg.date ? new Date(leg.date).toLocaleDateString() : '-'}
                        </td>
                        <td className="border border-gray-300 p-2">{leg.player || '-'}</td>
                        <td className="border border-gray-300 p-2">{leg.opponent || '-'}</td>
                        <td className="border border-gray-300 p-2">{leg.darts || '-'}</td>
                        <td className="border border-gray-300 p-2">{leg.score_left || '-'}</td>
                        <td className="border border-gray-300 p-2">
                          <span className={`px-2 py-1 rounded text-sm ${
                            leg.result === 'Won' ? 'bg-green-100 text-green-800' : 
                            leg.result === 'Lost' ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {leg.result || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
              <CardDescription>Complete JDA session statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Date</th>
                      <th className="border border-gray-300 p-2 text-left">Player</th>
                      <th className="border border-gray-300 p-2 text-left">Points</th>
                      <th className="border border-gray-300 p-2 text-left">Bonus</th>
                      <th className="border border-gray-300 p-2 text-left">Games</th>
                      <th className="border border-gray-300 p-2 text-left">Won</th>
                      <th className="border border-gray-300 p-2 text-left">Lost</th>
                      <th className="border border-gray-300 p-2 text-left">Average</th>
                      <th className="border border-gray-300 p-2 text-left">180s</th>
                      <th className="border border-gray-300 p-2 text-left">171s</th>
                      <th className="border border-gray-300 p-2 text-left">Closer</th>
                      <th className="border border-gray-300 p-2 text-left">Block</th>
                      <th className="border border-gray-300 p-2 text-left">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stats.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2">
                          {record.date ? new Date(record.date).toLocaleDateString() : '-'}
                        </td>
                        <td className="border border-gray-300 p-2">{record.player || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.points || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.bonus || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.games || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.won || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.lost || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.average || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.one_eighty || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.one_seventy_one || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.closer || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.block || '-'}</td>
                        <td className="border border-gray-300 p-2">{record.block_position || '-'}</td>
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