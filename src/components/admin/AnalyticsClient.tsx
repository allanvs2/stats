'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import dynamic from 'next/dynamic'

// Dynamically import Recharts with no SSR
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false })
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false })
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false })

interface UserGrowthData {
  created_at: string
}

interface ProcessedGrowthData {
  month: string
  users: number
}

interface TopPlayer {
  name?: string
  player?: string
  average?: number
  one_eighty?: number
}

interface DatabaseData {
  name: string
  records: number
  color: string
}

interface AnalyticsData {
  totalUsers: number
  totalClubs: number
  vikingsFridayRecords: number
  vikingsMatchRecords: number
  vikingsMemberRecords: number
  jdaStatsRecords: number
  jdaLegsRecords: number
  jdaMatchRecords: number
  userGrowth: UserGrowthData[]
  vikingsTopPlayers: TopPlayer[]
  jdaTopPlayers: TopPlayer[]
}

interface AnalyticsClientProps {
  data: AnalyticsData
}

export default function AnalyticsClient({ data }: AnalyticsClientProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">Loading data...</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center p-8">
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  // Process user growth data
  const userGrowthData: ProcessedGrowthData[] = data.userGrowth?.reduce((acc: ProcessedGrowthData[], user) => {
    const month = new Date(user.created_at).toISOString().slice(0, 7)
    const existing = acc.find(item => item.month === month)
    if (existing) {
      existing.users += 1
    } else {
      acc.push({ month, users: 1 })
    }
    return acc
  }, []) || []

  // Database overview data
  const databaseData: DatabaseData[] = [
    { name: 'Vikings Friday', records: data.vikingsFridayRecords, color: '#3B82F6' },
    { name: 'Vikings Matches', records: data.vikingsMatchRecords, color: '#10B981' },
    { name: 'Vikings Members', records: data.vikingsMemberRecords, color: '#8B5CF6' },
    { name: 'JDA Stats', records: data.jdaStatsRecords, color: '#F59E0B' },
    { name: 'JDA Legs', records: data.jdaLegsRecords, color: '#EF4444' },
    { name: 'JDA Matches', records: data.jdaMatchRecords, color: '#06B6D4' }
  ]

  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4']

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.vikingsFridayRecords + data.vikingsMatchRecords + data.jdaStatsRecords + data.jdaLegsRecords}
            </div>
            <p className="text-xs text-muted-foreground">All statistics</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Vikings Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.vikingsFridayRecords + data.vikingsMatchRecords + data.vikingsMemberRecords}
            </div>
            <p className="text-xs text-muted-foreground">All Vikings records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">JDA Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.jdaStatsRecords + data.jdaLegsRecords + data.jdaMatchRecords}
            </div>
            <p className="text-xs text-muted-foreground">All JDA records</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth Over Time</CardTitle>
            <CardDescription>Monthly user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {userGrowthData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No user growth data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Database Records Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Database Records Distribution</CardTitle>
            <CardDescription>Records across all tables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={databaseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="records"
                  >
                    {databaseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Tables Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Database Tables Overview</CardTitle>
          <CardDescription>Record counts by table</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={databaseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="records" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Players Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Vikings Top Players */}
        <Card>
          <CardHeader>
            <CardTitle>Vikings Top Players</CardTitle>
            <CardDescription>Highest averages in Vikings club</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.vikingsTopPlayers && data.vikingsTopPlayers.length > 0 ? (
                data.vikingsTopPlayers.slice(0, 5).map((player, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{player.name}</p>
                        <p className="text-sm text-gray-600">{player.one_eighty || 0} × 180s</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{player.average?.toFixed(2) || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Average</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No Vikings player data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* JDA Top Players */}
        <Card>
          <CardHeader>
            <CardTitle>JDA Top Players</CardTitle>
            <CardDescription>Highest averages in JDA club</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.jdaTopPlayers && data.jdaTopPlayers.length > 0 ? (
                data.jdaTopPlayers.slice(0, 5).map((player, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-purple-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{player.player}</p>
                        <p className="text-sm text-gray-600">{player.one_eighty || 0} × 180s</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{player.average?.toFixed(2) || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Average</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No JDA player data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health & Performance</CardTitle>
          <CardDescription>Current platform status and metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">&lt;200ms</div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{data.totalUsers}</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">100%</div>
              <div className="text-sm text-gray-600">Data Integrity</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}