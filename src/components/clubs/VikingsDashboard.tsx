import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, Trophy, Target, Calculator, Zap, ArrowLeft } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
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

interface ClubStats {
  totalGames: number;
  total180s: number;
  totalDarts: number;
  clubAverage: number;
  seasons: string[];
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

      // First, get available seasons (numeric)
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('vikings_friday')
        .select('season')
        .not('season', 'is', null)
        .order('season', { ascending: false });

      if (seasonsError) throw seasonsError;

      const uniqueSeasons = [...new Set(seasonsData?.map(item => String(item.season)) || [])];
      const currentSeason = uniqueSeasons[0] || '';

      // Update club stats with seasons
      setClubStats(prev => ({ ...prev, seasons: uniqueSeasons }));

      // If no season selected, use current season
      const seasonToQuery = selectedSeason === 'current' ? currentSeason : selectedSeason;

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
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 bg-green-50 border-green-200';
    if (change < 0) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Header with Back Button and Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Vikings Club Dashboard</h2>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Header with Back Button and Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Vikings Club Dashboard</h2>
              </div>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600">Error loading dashboard: {error}</p>
              <Button onClick={fetchVikingsData} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-400/60 rounded border-b-2">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header with Back Button, Logo and Season Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 hover:bg-gray-50 text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Vikings Club</h2>
                <p className="text-sm text-gray-500">Friday Night League</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-900">Season:</label>
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger className="w-40 text-gray-900">
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Season</SelectItem>
                  {clubStats.seasons.map((season) => (
                    <SelectItem key={season} value={season}>
                      Season {season}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0">
              <Image
                src="/logo_small.png"
                alt="Logo"
                width={103}
                height={210}
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Games</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.floor(clubStats.totalGames / 2).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Games played this season
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total 180s</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clubStats.total180s.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Maximum scores achieved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Darts Thrown</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clubStats.totalDarts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Darts thrown this season
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Club Average (Latest Week)</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clubStats.clubAverage}</div>
              <p className="text-xs text-muted-foreground">
                Latest week&apos;s club average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Rankings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Club Rankings</CardTitle>
            <CardDescription>
              Current standings for {selectedSeason === 'current' ? 'this season' : `season ${selectedSeason}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Position</th>
                    <th className="text-left p-2 font-medium">Player</th>
                    <th className="text-right p-2 font-medium">Points</th>
                    <th className="text-right p-2 font-medium">Games</th>
                    <th className="text-right p-2 font-medium">180s</th>
                    <th className="text-right p-2 font-medium">171s</th>
                    <th className="text-right p-2 font-medium">Average</th>
                    <th className="text-center p-2 font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((player, index) => (
                    <tr key={player.name} className={`border-b hover:bg-gray-50 ${index < 3 ? 'bg-yellow-50' : ''}`}>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {index < 3 && (
                            <Trophy className={`h-4 w-4 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-yellow-600'}`} />
                          )}
                          <span className="font-medium">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="p-2 font-medium">{player.name}</td>
                      <td className="p-2 text-right">{player.points}</td>
                      <td className="p-2 text-right">{player.games}</td>
                      <td className="p-2 text-right">{player['180s']}</td>
                      <td className="p-2 text-right">{player['171s']}</td>
                      <td className="p-2 text-right font-mono">{player.average}</td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getChangeIcon(player.change)}
                          <span className={`font-medium ${
                            player.change > 0 ? 'text-green-600' : 
                            player.change < 0 ? 'text-red-600' : 
                            'text-gray-500'
                          }`}>
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
                <div className="text-center py-8 text-gray-500">
                  No player data found for the selected season.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}