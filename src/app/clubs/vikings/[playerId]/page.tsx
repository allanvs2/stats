'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Target, Trophy, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import React from 'react';

interface VikingsFridayData {
  id: string;
  date: string;
  name: string;
  points: number;
  games: number;
  won: number;
  lost: number;
  darts_thrown: number;
  score_left: number;
  average: number;
  one_eighty: number;
  one_seventy_one: number;
  high_closer: number;
  winner: number;
  block: string;
  season: string;
}

interface VikingsMatchData {
  id: string;
  date: string;
  player: string;
  against: string;
  legs: number;
  ave: number;
  result: string;
  season: number;
  year: number;
}

interface PlayerStats {
  highestAverage: number;
  winPercentage: number;
  accumulatedAverage: number;
  totalLegsWon: number;
  totalLegsLost: number;
  totalDartsThrown: number;
  total180s: number;
  total171s: number;
  highestCloser: number;
}

interface WeeklyAverage {
  week: string;
  average: number;
}

interface TopOpponent {
  opponent: string;
  timesPlayed: number;
  wins: number;
  losses: number;
}

interface TopMatch {
  date: string;
  against: string;
  average: number;
  result: string;
}

export default function VikingsPlayerStatsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerId = params.playerId as string;
  const seasonParam = searchParams.get('season') || 'current';
  
  const playerName = playerId ? decodeURIComponent(playerId) : '';

  const [fridayData, setFridayData] = useState<VikingsFridayData[]>([]);
  const [matchData, setMatchData] = useState<VikingsMatchData[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [weeklyAverages, setWeeklyAverages] = useState<WeeklyAverage[]>([]);
  const [topOpponents, setTopOpponents] = useState<TopOpponent[]>([]);
  const [topMatches, setTopMatches] = useState<TopMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (playerName) {
      fetchPlayerData();
    } else {
      setError('No player name provided');
      setLoading(false);
    }
  }, [playerName, seasonParam]);

  const fetchPlayerData = async () => {
    if (!playerName) {
      setError('No player name provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let seasonToQuery: number | null = null;
      
      if (seasonParam !== 'current') {
        seasonToQuery = parseInt(seasonParam);
      } else {
        const { data: seasonsData } = await supabase
          .from('vikings_friday')
          .select('season')
          .not('season', 'is', null)
          .order('season', { ascending: false })
          .limit(1);
        
        if (seasonsData && seasonsData.length > 0) {
          seasonToQuery = seasonsData[0].season;
        }
      }

      let fridayQuery = supabase
        .from('vikings_friday')
        .select('*')
        .eq('name', playerName);
      
      if (seasonToQuery !== null) {
        fridayQuery = fridayQuery.eq('season', seasonToQuery);
      }

      const { data: fridayResponse, error: fridayError } = await fridayQuery
        .order('date', { ascending: true });

      if (fridayError) throw fridayError;

      let matchQuery = supabase
        .from('vikings_matches')
        .select('*')
        .eq('player', playerName);
      
      if (seasonToQuery !== null && seasonToQuery !== undefined) {
        matchQuery = matchQuery.eq('season', seasonToQuery);
      }

      const { data: matchResponse, error: matchError } = await matchQuery
        .order('date', { ascending: false });

      if (matchError) throw matchError;

      setFridayData(fridayResponse || []);
      setMatchData(matchResponse || []);

      if (fridayResponse && fridayResponse.length > 0) {
        calculatePlayerStats(fridayResponse);
        calculateWeeklyAverages(fridayResponse);
      }

      if (matchResponse && matchResponse.length > 0) {
        calculateTopOpponents(matchResponse);
        calculateTopMatches(matchResponse);
      }

    } catch (err: unknown) {
      console.error('Error fetching player data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch player data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculatePlayerStats = (fridayData: VikingsFridayData[]) => {
    const highestAverage = Math.max(...fridayData.map(d => d.average || 0));
    const totalGames = fridayData.reduce((sum, d) => sum + (d.games || 0), 0);
    const totalWon = fridayData.reduce((sum, d) => sum + (d.won || 0), 0);
    const winPercentage = totalGames > 0 ? (totalWon / totalGames) * 100 : 0;
    const totalPointsWeighted = fridayData.reduce((sum, d) => sum + (d.average || 0) * (d.games || 0), 0);
    const accumulatedAverage = totalGames > 0 ? totalPointsWeighted / totalGames : 0;
    const totalLegsWon = fridayData.reduce((sum, d) => sum + (d.won || 0), 0);
    const totalLegsLost = fridayData.reduce((sum, d) => sum + (d.lost || 0), 0);
    const totalDartsThrown = fridayData.reduce((sum, d) => sum + (d.darts_thrown || 0), 0);
    const total180s = fridayData.reduce((sum, d) => sum + (d.one_eighty || 0), 0);
    const total171s = fridayData.reduce((sum, d) => sum + (d.one_seventy_one || 0), 0);
    const highestCloser = Math.max(...fridayData.map(d => d.high_closer || 0));

    setPlayerStats({
      highestAverage,
      winPercentage,
      accumulatedAverage,
      totalLegsWon,
      totalLegsLost,
      totalDartsThrown,
      total180s,
      total171s,
      highestCloser
    });
  };

  const calculateWeeklyAverages = (fridayData: VikingsFridayData[]) => {
    const weeklyData = fridayData.map(d => ({
      week: new Date(d.date).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
      }),
      average: d.average || 0
    }));

    setWeeklyAverages(weeklyData);
  };

  const calculateTopOpponents = (matchData: VikingsMatchData[]) => {
    const opponentStats: { [key: string]: { played: number; wins: number; losses: number } } = {};

    matchData.forEach(match => {
      const opponent = match.against;
      if (!opponentStats[opponent]) {
        opponentStats[opponent] = { played: 0, wins: 0, losses: 0 };
      }
      
      opponentStats[opponent].played++;
      
      const result = match.result?.toLowerCase() || '';
      if (result === 'won' || result === 'win' || result === 'w' || result.includes('won')) {
        opponentStats[opponent].wins++;
      } else if (result === 'lost' || result === 'lose' || result === 'l' || result.includes('lost')) {
        opponentStats[opponent].losses++;
      } else {
        opponentStats[opponent].losses++;
      }
    });

    const topOpponents = Object.entries(opponentStats)
      .map(([opponent, stats]) => ({
        opponent,
        timesPlayed: stats.played,
        wins: stats.wins,
        losses: stats.losses
      }))
      .sort((a, b) => b.timesPlayed - a.timesPlayed)
      .slice(0, 5);
    
    setTopOpponents(topOpponents);
  };

  const calculateTopMatches = (matchData: VikingsMatchData[]) => {
    const topMatches = matchData
      .filter(match => match.ave > 0)
      .sort((a, b) => b.ave - a.ave)
      .slice(0, 10)
      .map(match => ({
        date: new Date(match.date).toLocaleDateString('en-GB'),
        against: match.against,
        average: match.ave,
        result: match.result
      }));

    setTopMatches(topMatches);
  };

  if (loading) {
    return (
    <div className="min-h-screen bg-zinc-500 relative overflow-hidden">
      <div className="container mx-auto px-4 py-6 space-y-6 relative z-10">
  {/* Club Header */}
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center opacity-90">
    <h1 className="text-3xl font-bold text-slate-900">Vikings Dart Club</h1>
    <p className="text-slate-600">~~~ For the love of the Game ~~~~</p>
  </div>

    <div className="min-h-screen bg-zinc-500 relative overflow-hidden">
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-lg z-0"
        style={{
          backgroundImage: 'url(/bnw.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'fill',
          backgroundSize: '100%',
          /* opacity: 0.4 */
        }}
      />
        
        <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
      </div>
</div>

    );
  }

  if (error) {
    return (
    <div className="min-h-screen bg-zinc-500 relative overflow-hidden">
      <div className="container mx-auto px-4 py-6 space-y-6 relative z-10">
  {/* Club Header */}
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center opacity-90">
    <h1 className="text-3xl font-bold text-slate-900">Vikings Dart Club</h1>
    <p className="text-slate-600">~~~ For the love of the Game ~~~~</p>
  </div>

    <div className="min-h-screen bg-zinc-500 relative overflow-hidden">
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-lg z-0"
        style={{
          backgroundImage: 'url(/bnw.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'fill',
          backgroundSize: '100%',
          /* opacity: 0.4 */
        }}
      />
        
        <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mb-6 border-slate-300 hover:bg-slate-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vikings
          </Button>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <p className="text-red-700">Error: {error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-500 relative overflow-hidden">
      <div className="container mx-auto px-4 py-6 space-y-6 relative z-10">
  {/* Club Header */}
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center opacity-90">
    <h1 className="text-3xl font-bold text-slate-900">Vikings Dart Club</h1>
    <p className="text-slate-600">~~~ For the love of the Game ~~~~</p>
  </div>

    <div className="min-h-screen bg-zinc-500 relative overflow-hidden">
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-lg z-0"
        style={{
          backgroundImage: 'url(/bnw.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'fill',
          backgroundSize: '100%',
          /* opacity: 0.4 */
        }}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="border-slate-300 hover:text-black"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vikings
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {playerName || 'Unknown Player'}
              </h1>
              <p className="text-sm text-white mt-1">
                {seasonParam === 'current' ? 'Current Season' : `Season ${seasonParam}`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 opacity-95">
          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Highest Nightly Average</CardTitle>
              <Target className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {playerStats?.highestAverage.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow opacity-95">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Games Won %</CardTitle>
              <Trophy className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {playerStats?.winPercentage.toFixed(1) || '0.0'}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow opacity-95">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Accumulated Average</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {playerStats?.accumulatedAverage.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow opacity-95">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Total Legs</CardTitle>
              <Zap className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-slate-900">
                Played: {(playerStats?.totalLegsWon || 0) + (playerStats?.totalLegsLost || 0)}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                W: {playerStats?.totalLegsWon || 0} | L: {playerStats?.totalLegsLost || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow opacity-95">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Total Darts Thrown</CardTitle>
              <Target className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {playerStats?.totalDartsThrown?.toLocaleString() || '0'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow opacity-95">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Total 180s</CardTitle>
              <Target className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {playerStats?.total180s || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow opacity-95">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Total 171s</CardTitle>
              <Target className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {playerStats?.total171s || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow opacity-95">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Highest Closer</CardTitle>
              <Trophy className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {playerStats?.highestCloser || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 bg-white border-slate-200 shadow-sm opacity-90">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-slate-900">Weekly Averages Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyAverages}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                  formatter={(value, name) => [
                      `${Number(value ?? 0).toFixed(2)}`,
                      name === 'average' ? 'Average' : name
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="average" 
                    stroke="#b91c1c" 
                    strokeWidth={3}
                    dot={{ fill: '#b91c1c', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white border-slate-200 shadow-sm opacity-90">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-slate-900">Top 5 Most Played Opponents</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-2 font-semibold text-slate-700">Opponent</th>
                      <th className="text-center p-2 font-semibold text-slate-700">Played</th>
                      <th className="text-center p-2 font-semibold text-slate-700">Wins</th>
                      <th className="text-center p-2 font-semibold text-slate-700">Losses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topOpponents.map((opponent, index) => (
                      <tr key={index} className="border-b border-slate-100 hover:bg-red-50 transition-colors">
                        <td className="p-2 font-medium text-slate-900">{opponent.opponent}</td>
                        <td className="p-2 text-center text-slate-700">{opponent.timesPlayed}</td>
                        <td className="p-2 text-center text-emerald-600 font-semibold">{opponent.wins}</td>
                        <td className="p-2 text-center text-rose-600 font-semibold">{opponent.losses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {topOpponents.length === 0 && (
                  <p className="text-center text-slate-500 py-4">No match data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm opacity-90">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-slate-900">Top 10 Highest Average Games</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-2 font-semibold text-slate-700">Date</th>
                      <th className="text-left p-2 font-semibold text-slate-700">Against</th>
                      <th className="text-center p-2 font-semibold text-slate-700">Average</th>
                      <th className="text-center p-2 font-semibold text-slate-700">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMatches.map((match, index) => (
                      <tr key={index} className="border-b border-slate-100 hover:bg-red-50 transition-colors">
                        <td className="p-2 text-slate-700">{match.date}</td>
                        <td className="p-2 text-slate-900">{match.against}</td>
                        <td className="p-2 text-center font-bold text-slate-900">{match.average.toFixed(2)}</td>
                        <td className={`p-2 text-center font-medium ${
                          match.result === 'Won' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {match.result}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {topMatches.length === 0 && (
                  <p className="text-center text-slate-500 py-4">No match data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}