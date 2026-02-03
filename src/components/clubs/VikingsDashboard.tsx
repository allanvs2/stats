'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, Trophy, Target, Calculator, Zap, ArrowLeft } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface VikingsStats {
  position: number;
  name: string;
  points: number;
  games: number;
  '180s': number;
  '171s': number;
  average: number;
  change: number;
}

interface SeasonEntry {
  season: string;
  year: number;
  label: string;
  value: string; // "season_year" e.g. "1_2026"
}

interface ClubStats {
  totalGames: number;
  total180s: number;
  totalDarts: number;
  clubAverage: number;
  seasons: SeasonEntry[];
}

interface AggregatedPlayer {
  name: string;
  points: number;
  games: number;
  '180s': number;
  '171s': number;
  totalScore: number;
  totalDarts: number;
}

interface DatabaseRow {
  name: string;
  points: number | null;
  games: number | null;
  one_eighty: number | null;
  one_seventy_one: number | null;
  darts_thrown: number | null;
  score_left: number | null;
}

export default function VikingsDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<VikingsStats[]>([]);
  const [clubStats, setClubStats] = useState<ClubStats>({
    totalGames: 0,
    total180s: 0,
    totalDarts: 0,
    clubAverage: 0,
    seasons: []
  });
  // Resolved season number actually being queried (used for player links)
  const [resolvedSeason, setResolvedSeason] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('current');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const fetchVikingsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch season + date so we can derive the year for each season
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('vikings_friday')
        .select('season, date')
        .not('season', 'is', null)
        .order('date', { ascending: false });

      if (seasonsError) throw seasonsError;

      // Build deduplicated season entries keyed by "season_year"
      const seenKeys = new Set<string>();
      const seasonEntries: SeasonEntry[] = [];
      // Also track which season_year has the latest date (first row, since sorted desc)
      let latestSeasonValue = '';

      for (const row of seasonsData || []) {
        const season = String(row.season);
        const year = row.date ? new Date(row.date).getFullYear() : new Date().getFullYear();
        const value = `${season}_${year}`;

        if (!latestSeasonValue) latestSeasonValue = value; // first row = most recent date

        if (!seenKeys.has(value)) {
          seenKeys.add(value);
          seasonEntries.push({
            season,
            year,
            label: `Season ${season} (${year})`,
            value
          });
        }
      }

      // Sort: most recent year first, then highest season number first within same year
      seasonEntries.sort((a, b) => b.year - a.year || Number(b.season) - Number(a.season));

      setClubStats(prev => ({ ...prev, seasons: seasonEntries }));

      // Resolve what season number to actually query
      let seasonToQuery: string;
      if (selectedSeason === 'current') {
        // Use the season with the most recent date
        const latest = seasonEntries.find(e => e.value === latestSeasonValue);
        seasonToQuery = latest?.season || seasonEntries[0]?.season || '';
        setResolvedSeason(seasonToQuery);
      } else {
        // selectedSeason is "season_year" e.g. "1_2026" — extract the season number
        seasonToQuery = selectedSeason.split('_')[0];
        setResolvedSeason(seasonToQuery);
      }
      
      console.log('Selected season:', selectedSeason);
      console.log('Season to query:', seasonToQuery);

      // Get club statistics for the selected season
      const { data: clubData, error: clubError } = await supabase
        .from('vikings_friday')
        .select('games, one_eighty, darts_thrown, score_left')
        .eq('season', parseInt(seasonToQuery));

      if (clubError) throw clubError;

      // Calculate club stats
      const totalGames = clubData?.reduce((sum, row) => sum + (row.games || 0), 0) || 0;
      const total180s = clubData?.reduce((sum, row) => sum + (row.one_eighty || 0), 0) || 0;
      const totalDarts = clubData?.reduce((sum, row) => sum + (row.darts_thrown || 0), 0) || 0;
      
      // Calculate club average from latest week only
      const { data: latestWeekData, error: latestError } = await supabase
        .from('vikings_friday')
        .select('games, score_left, darts_thrown, date')
        .eq('season', parseInt(seasonToQuery))
        .order('date', { ascending: false })
        .limit(50);

      if (latestError) throw latestError;

      const latestDate = latestWeekData?.[0]?.date;
      const latestWeekEntries = latestWeekData?.filter(entry => entry.date === latestDate) || [];
      
      const latestWeekScore = latestWeekEntries.reduce((sum, row) => sum + ((row.games || 0) * 501 - (row.score_left || 0)), 0);
      const latestWeekDarts = latestWeekEntries.reduce((sum, row) => sum + (row.darts_thrown || 0), 0);
      const clubAverage = latestWeekDarts > 0 ? Math.round((latestWeekScore / latestWeekDarts * 3) * 100) / 100 : 0;

      setClubStats(prev => ({
        ...prev,
        totalGames,
        total180s,
        totalDarts,
        clubAverage
      }));

      // Try to use the stored procedure first
      try {
        const { data: rankingsData, error: rankingsError } = await supabase.rpc('get_vikings_rankings', {
          target_season: seasonToQuery
        });

        if (rankingsError) throw rankingsError;
        
        // Debug: Log the data to see what's coming back
        console.log('Rankings data:', rankingsData);
        
        setStats(rankingsData || []);
      } catch (rpcError) {
        console.log('Stored procedure not available, using fallback query');
        await fetchSimpleRankings(parseInt(seasonToQuery));
      }

    } catch (err) {
      console.error('Error fetching Vikings data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVikingsData();
  }, [selectedSeason]);

  // Fallback method if the stored procedure doesn't exist
  const fetchSimpleRankings = async (season: number) => {
    const { data, error } = await supabase
      .from('vikings_friday')
      .select('name, points, games, one_eighty, one_seventy_one, darts_thrown, score_left')
      .eq('season', season);

    if (error) throw error;

    // Simple aggregation with proper typing
    const aggregated = data?.reduce((acc: Record<string, AggregatedPlayer>, row: DatabaseRow) => {
      const name = row.name;
      if (!acc[name]) {
        acc[name] = {
          name,
          points: 0,
          games: 0,
          '180s': 0,
          '171s': 0,
          totalScore: 0,
          totalDarts: 0
        };
      }
      acc[name].points += row.points || 0;
      acc[name].games += row.games || 0;
      acc[name]['180s'] += row.one_eighty || 0;
      acc[name]['171s'] += row.one_seventy_one || 0;
      acc[name].totalScore += (row.games || 0) * 501 - (row.score_left || 0);
      acc[name].totalDarts += row.darts_thrown || 0;
      return acc;
    }, {});

    const rankings = Object.values(aggregated || {}).map((player: AggregatedPlayer, index) => ({
      position: index + 1,
      name: player.name,
      points: player.points,
      games: player.games,
      '180s': player['180s'],
      '171s': player['171s'],
      average: player.totalDarts > 0 ? Math.round((player.totalScore / player.totalDarts * 3) * 100) / 100 : 0,
      change: 0 // Simple fallback doesn't calculate position changes
    })).sort((a, b) => b.points - a.points || b.average - a.average);

    setStats(rankings as VikingsStats[]);
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-emerald-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-rose-600" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-emerald-600';
    if (change < 0) return 'text-rose-600';
    return 'text-slate-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 relative overflow-hidden bg-zinc-500 rounded-lg">
       
        <div className="container mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Club Header */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center opacity-90">
            <h1 className="text-3xl font-bold text-slate-900">Vikings Dart Club</h1>
            <p className="text-slate-600">~~~ For the love of the Game ~~~~</p>
          </div>
       
       
        {/* Background Logo */}
        <div 
          className="absolute inset-0 flex items-center justify-center top-[150px] pointer-events-none rounded-lg"
          style={{
            backgroundImage: 'url(/bnw.png)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'fill',
            backgroundSize: '100%',
            /* opacity: 0.3 */
          }}
        />
        
        <div className="container mx-auto px-4 py-6 space-y-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBackToDashboard}
                className="border-slate-300 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-700 to-red-900 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Vikings Club Dashboard</h2>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
     </div> 
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 relative overflow-hidden bg-zinc-500 rounded-lg">
        
        <div className="container mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Club Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center opacity-90">
          <h1 className="text-3xl font-bold text-slate-900">Vikings Dart Club</h1>
          <p className="text-slate-600">~~~ For the love of the Game ~~~~</p>
        </div>


        {/* Background Logo */}
        <div 
          className="absolute inset-0 flex items-center justify-center top-[150px] pointer-events-none rounded-lg"
          style={{
            backgroundImage: 'url(/bnw.png)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'fill',
            backgroundSize: '100%',
            /* opacity: 0.3 */
          }}
        />
        
        
        <div className="container mx-auto px-4 py-6 space-y-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBackToDashboard}
                className="border-slate-300 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-700 to-red-900 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Vikings Club Dashboard</h2>
              </div>
            </div>
          </div>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <p className="text-red-700">Error loading dashboard: {error}</p>
              <Button onClick={fetchVikingsData} className="mt-4 bg-red-700 hover:bg-red-800 text-white">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-slate-50 relative overflow-hidden bg-zinc-500 rounded-lg">
      {/* Background Logo with 90% transparency (opacity: 0.1) */}
      
      <div className="container mx-auto px-4 py-6 space-y-6 relative z-10">
  {/* Club Header */}
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center opacity-90">
    <h1 className="text-3xl font-bold text-slate-900">Vikings Dart Club</h1>
    <p className="text-slate-600">~~~ For the love of the Game ~~~~</p>
  </div>
     
      
      <div 
        className="absolute inset-0 flex items-center justify-center p-6 top-[150px] pointer-events-none rounded-lg z-0"
        style={{
          backgroundImage: 'url(/bnw.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'fill',
          backgroundSize: '100%',
          
          /* borderRadius: 'xl', */
         /*  opacity: 0.3, */
        
        }}
      />
      
      <div className="container mx-auto px-4 py-6 space-y-6 relative z-10 ">
        {/* Header with Back Button and Season Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBackToDashboard}
              className="border-slate-300 hover:bg-slate-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-700 to-red-900 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Vikings Club</h2>
                <p className="text-sm text-white">Friday Night League</p>
              </div>
            </div>
                <Button
      variant="outline"
      size="sm"
      onClick={() => router.push('/clubs/vikings/handicaps')}
      className="border-slate-300 hover:bg-slate-100"
    >
      <Target className="mr-2 h-4 w-4" />
      View Handicaps
    </Button>
          </div>


          
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-white">Season:</label>
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="w-40 border-slate-300 text-black">
                <SelectValue placeholder="Select season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Season</SelectItem>
                {clubStats.seasons.map((entry) => (
                  <SelectItem key={entry.value} value={entry.value}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics Cards - Clean Design */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow opacity-90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Total Games</CardTitle>
              <Trophy className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{Math.floor(clubStats.totalGames / 2).toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">
                Games played this season
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow opacity-90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Total 180s</CardTitle>
              <Target className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{clubStats.total180s.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">
                Maximum scores achieved
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow opacity-90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Total Darts Thrown</CardTitle>
              <Zap className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{clubStats.totalDarts.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">
                Darts thrown this season
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow opacity-90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Club Average</CardTitle>
              <Calculator className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{clubStats.clubAverage}</div>
              <p className="text-xs text-slate-500 mt-1">
                Latest week&apos;s average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Rankings Table */}
        <Card className="bg-white border-slate-200 shadow-sm opacity-90">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-slate-900">Club Rankings</CardTitle>
            <CardDescription className="text-slate-600">
              Current standings for {selectedSeason === 'current'
                ? (clubStats.seasons.find(e => e.season === resolvedSeason)?.label || 'this season')
                : (clubStats.seasons.find(e => e.value === selectedSeason)?.label || `season ${selectedSeason}`)}
              <br />
              <span className="text-red-700 font-medium">Click on player names to view detailed individual statistics</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto overflow-y-scroll max-h-[1500px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-3 font-semibold text-slate-700">Position</th>
                    <th className="text-left p-3 font-semibold text-slate-700">Player</th>
                    <th className="text-right p-3 font-semibold text-slate-700">Points</th>
                    <th className="text-right p-3 font-semibold text-slate-700">Games</th>
                    <th className="text-right p-3 font-semibold text-slate-700">180s</th>
                    <th className="text-right p-3 font-semibold text-slate-700">171s</th>
                    <th className="text-right p-3 font-semibold text-slate-700">Average</th>
                    <th className="text-center p-3 font-semibold text-slate-700">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((player, index) => (
                    <tr 
                      key={player.name} 
                      className={`border-b border-slate-100 hover:bg-red-50 transition-colors ${
                        index < 3 ? 'bg-gradient-to-r from-red-50 to-transparent' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {index < 3 && (
                            <Trophy className={`h-4 w-4 ${
                              index === 0 ? 'text-yellow-500' : 
                              index === 1 ? 'text-slate-400' : 
                              'text-amber-600'
                            }`} />
                          )}
                          <span className="font-semibold text-slate-700">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Link 
                          href={`/clubs/vikings/${encodeURIComponent(player.name)}?season=${resolvedSeason}&year=${selectedSeason === 'current' ? (clubStats.seasons.find(e => e.season === resolvedSeason)?.year || new Date().getFullYear()) : (clubStats.seasons.find(e => e.value === selectedSeason)?.year || new Date().getFullYear())}`}
                          className="text-red-700 hover:text-red-900 hover:underline font-medium cursor-pointer transition-colors duration-200"
                        >
                          {player.name}
                        </Link>
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-900">{player.points}</td>
                      <td className="p-3 text-right text-slate-700">{player.games}</td>
                      <td className="p-3 text-right text-slate-700">{player['180s']}</td>
                      <td className="p-3 text-right text-slate-700">{player['171s']}</td>
                      <td className="p-3 text-right font-mono font-medium text-slate-900">{player.average}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getChangeIcon(player.change)}
                          <span className={`font-medium ${getChangeColor(player.change)}`}>
                            {player.change !== null && player.change !== undefined && player.change !== 0 ? 
                              (player.change > 0 ? `+${player.change}` : player.change) : 
                              '-'
                            }
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {stats.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No player data found for the selected season.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
     </div>
  );
}