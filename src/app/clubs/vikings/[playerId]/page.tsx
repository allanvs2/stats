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
  
  // Handle the case where playerId might be undefined
  const playerName = playerId ? decodeURIComponent(playerId) : '';
  
  // Debug logging to see what we're getting
  console.log('Raw params:', params);
  console.log('playerId:', playerId);
  console.log('playerName:', playerName);
  console.log('seasonParam:', seasonParam);

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
  }, [playerName]);

  const fetchPlayerData = async () => {
    if (!playerName) {
      setError('No player name provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching data for player:', playerName);
      console.log('For season:', seasonParam);

      // Determine the actual season to query
      let seasonToQuery: number | null = null;
      
      if (seasonParam !== 'current') {
        seasonToQuery = parseInt(seasonParam);
      } else {
        // Get the latest season from the database
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

      console.log('Querying season:', seasonToQuery);

      // Build the query with season filter
      let fridayQuery = supabase
        .from('vikings_friday')
        .select('*')
        .eq('name', playerName);
      
      if (seasonToQuery !== null) {
        fridayQuery = fridayQuery.eq('season', seasonToQuery);
      }

      const { data: fridayResponse, error: fridayError } = await fridayQuery
        .order('date', { ascending: true });

      console.log('Friday data response:', fridayResponse);
      console.log('Friday error:', fridayError);

      if (fridayError) throw fridayError;

      // Fetch Vikings Matches data with season filter
      let matchQuery = supabase
        .from('vikings_matches')
        .select('*')
        .eq('player', playerName);
      
      if (seasonToQuery !== null) {
        matchQuery = matchQuery.eq('season', seasonToQuery);
      }

      const { data: matchResponse, error: matchError } = await matchQuery
        .order('date', { ascending: false });

      console.log('Match data response:', matchResponse);
      console.log('Match error:', matchError);

      if (matchError) throw matchError;

      setFridayData(fridayResponse || []);
      setMatchData(matchResponse || []);

      // Calculate stats
      if (fridayResponse && fridayResponse.length > 0) {
        calculatePlayerStats(fridayResponse, matchResponse || []);
        calculateWeeklyAverages(fridayResponse);
      } else {
        console.log('No Friday data found for player:', playerName, 'in season:', seasonToQuery);
      }

      if (matchResponse && matchResponse.length > 0) {
        calculateTopOpponents(matchResponse);
        calculateTopMatches(matchResponse);
      } else {
        console.log('No match data found for player:', playerName);
      }

    } catch (err: any) {
      console.error('Error fetching player data:', err);
      setError(err.message || 'Failed to fetch player data');
    } finally {
      setLoading(false);
    }
  };

  const calculatePlayerStats = (fridayData: VikingsFridayData[], matchData: VikingsMatchData[]) => {
    // Highest nightly average
    const highestAverage = Math.max(...fridayData.map(d => d.average || 0));

    // Games won percentage
    const totalGames = fridayData.reduce((sum, d) => sum + (d.games || 0), 0);
    const totalWon = fridayData.reduce((sum, d) => sum + (d.won || 0), 0);
    const winPercentage = totalGames > 0 ? (totalWon / totalGames) * 100 : 0;

    // Accumulated average (weighted by games played)
    const totalPointsWeighted = fridayData.reduce((sum, d) => sum + (d.average || 0) * (d.games || 0), 0);
    const accumulatedAverage = totalGames > 0 ? totalPointsWeighted / totalGames : 0;

    // Total legs won/lost
    const totalLegsWon = fridayData.reduce((sum, d) => sum + (d.won || 0), 0);
    const totalLegsLost = fridayData.reduce((sum, d) => sum + (d.lost || 0), 0);

    // Total darts thrown
    const totalDartsThrown = fridayData.reduce((sum, d) => sum + (d.darts_thrown || 0), 0);

    // Total 180s and 171s
    const total180s = fridayData.reduce((sum, d) => sum + (d.one_eighty || 0), 0);
    const total171s = fridayData.reduce((sum, d) => sum + (d.one_seventy_one || 0), 0);

    // Highest closer
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
      
      // Check for various result formats that might indicate a win
      const result = match.result?.toLowerCase() || '';
      if (result === 'won' || result === 'win' || result === 'w' || result.includes('won')) {
        opponentStats[opponent].wins++;
      } else if (result === 'lost' || result === 'lose' || result === 'l' || result.includes('lost')) {
        opponentStats[opponent].losses++;
      } else {
        // If result format is unclear, log it for debugging
        console.log('Unclear match result format:', match.result, 'for match against', opponent);
        // For now, assume it's a loss if not clearly a win
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

    // Debug logging
    console.log('Opponent calculations:', topOpponents);
    
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
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-black-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-600 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-400 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-300 rounded-lg mb-8"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-black-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vikings
          </Button>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <p className="text-red-600">Error: {error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-400 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 text-gray-900">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vikings
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              {playerName || 'Unknown Player'} - Player Statistics
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {seasonParam === 'current' ? 'Current Season' : `Season ${seasonParam}`}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-slate-400 to-slate-600 text-white border border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Nightly Average</CardTitle>
              <Target className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {playerStats?.highestAverage.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-400 to-blue-600 text-white border border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Games Won %</CardTitle>
              <Trophy className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {playerStats?.winPercentage.toFixed(1) || '0.0'}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-slate-400 to-slate-600 text-white border border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accumulated Average</CardTitle>
              <TrendingUp className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {playerStats?.accumulatedAverage.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-400 to-blue-600 text-white border border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Legs</CardTitle>
              <Zap className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                Played: {(playerStats?.totalLegsWon || 0) + (playerStats?.totalLegsLost || 0)}
              </div>
              <div className="text-lg font-medium mt-1">
                W: {playerStats?.totalLegsWon || 0} | L: {playerStats?.totalLegsLost || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-slate-400 to-slate-600 text-white border border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Darts Thrown</CardTitle>
              <Target className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {playerStats?.totalDartsThrown?.toLocaleString() || '0'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-400 to-blue-600 text-white border border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total 180s</CardTitle>
              <Target className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {playerStats?.total180s || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-slate-400 to-slate-600 text-white border border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total 171s</CardTitle>
              <Target className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {playerStats?.total171s || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-400 to-blue-600 text-white border border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Closer</CardTitle>
              <Trophy className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {playerStats?.highestCloser || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Averages Trend */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Weekly Averages Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyAverages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="average" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout for Opponents and Top Matches */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top 5 Most Played Opponents */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Most Played Opponents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Opponent</th>
                      <th className="text-center p-2">Played</th>
                      <th className="text-center p-2">Wins</th>
                      <th className="text-center p-2">Losses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topOpponents.map((opponent, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{opponent.opponent}</td>
                        <td className="p-2 text-center">{opponent.timesPlayed}</td>
                        <td className="p-2 text-center text-green-600">{opponent.wins}</td>
                        <td className="p-2 text-center text-red-600">{opponent.losses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {topOpponents.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No match data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top 10 Highest Average Games */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Highest Average Games</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Against</th>
                      <th className="text-center p-2">Average</th>
                      <th className="text-center p-2">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMatches.map((match, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{match.date}</td>
                        <td className="p-2">{match.against}</td>
                        <td className="p-2 text-center font-bold">{match.average.toFixed(2)}</td>
                        <td className={`p-2 text-center font-medium ${
                          match.result === 'Won' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {match.result}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {topMatches.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No match data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}