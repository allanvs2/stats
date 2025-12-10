'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowLeft } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

interface HandicapData {
  name: string;
  season_average: number;
  handicap_start_score: number;
  handicap_adjustment: number;
}

export default function VikingsHandicapsPage() {
  const router = useRouter();
  const [handicaps, setHandicaps] = useState<HandicapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleBackToVikings = () => {
    router.push('/clubs/vikings');
  };

  useEffect(() => {
    async function fetchHandicaps() {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase.rpc('get_vikings_handicaps');
        
        if (error) throw error;
        
        setHandicaps(data || []);
      } catch (err) {
        console.error('Error fetching handicaps:', err);
        setError(err instanceof Error ? err.message : 'Failed to load handicaps');
      } finally {
        setLoading(false);
      }
    }

    fetchHandicaps();
  }, []);

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
            }}
          />
          
          <div className="container mx-auto px-4 py-6 space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBackToVikings}
                  className="border-slate-300 hover:bg-slate-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Vikings
                </Button>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-700 to-red-900 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">V</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Handicap System</h2>
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
            }}
          />
          
          <div className="container mx-auto px-4 py-6 space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBackToVikings}
                  className="border-slate-300 hover:bg-slate-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Vikings
                </Button>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-700 to-red-900 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">V</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Handicap System</h2>
                </div>
              </div>
            </div>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-6">
                <p className="text-red-700">Error loading handicaps: {error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4 bg-red-700 hover:bg-red-800 text-white">
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
      {/* Background Logo with 90% transparency */}
      
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
          }}
        />
        
        <div className="container mx-auto px-4 py-6 space-y-6 relative z-10">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBackToVikings}
                className="border-slate-300 hover:bg-slate-100"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Vikings
              </Button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-700 to-red-900 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white-900">Vikings Club</h2>
                  <p className="text-2xl text-white-600">Handicap System</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <Card className="bg-white border-slate-200 shadow-sm opacity-90">
            <CardHeader>
              <CardTitle className="text-slate-900">How the Handicap System Works</CardTitle>
              <CardDescription className="text-slate-600">
                The handicap system levels the playing field by adjusting start scores based on player averages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="font-semibold text-green-900 text-sm">45+ Average</div>
                  <div className="text-2xl font-bold text-green-700">501</div>
                  <div className="text-xs text-green-600">Scratch (0)</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-semibold text-blue-900 text-sm">40-44 Average</div>
                  <div className="text-2xl font-bold text-blue-700">451</div>
                  <div className="text-xs text-blue-600">-50 points</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="font-semibold text-yellow-900 text-sm">35-39 Average</div>
                  <div className="text-2xl font-bold text-yellow-700">401</div>
                  <div className="text-xs text-yellow-600">-100 points</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="font-semibold text-orange-900 text-sm">30-34 Average</div>
                  <div className="text-2xl font-bold text-orange-700">351</div>
                  <div className="text-xs text-orange-600">-150 points</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="font-semibold text-red-900 text-sm">Under 30</div>
                  <div className="text-2xl font-bold text-red-700">301</div>
                  <div className="text-xs text-red-600">-200 points</div>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                <strong>Example:</strong> If a player with 52 average (starts at 501) plays against a player with 36 average (starts at 401), 
                the weaker player needs to score 100 less to finish, making matches more competitive.
              </p>
            </CardContent>
          </Card>

          {/* Main Handicaps Table - Exact same styling as Vikings dashboard */}
          <Card className="bg-white border-slate-200 shadow-sm opacity-90">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-slate-900">Handicap Rankings</CardTitle>
              <CardDescription className="text-slate-600">
                Current season handicaps based on player averages (minimum 3 sessions required)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto overflow-y-scroll max-h-[1500px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-3 font-semibold text-slate-700">Position</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Player</th>
                      <th className="text-right p-3 font-semibold text-slate-700">Season Average</th>
                      <th className="text-right p-3 font-semibold text-slate-700">Start Score</th>
                      <th className="text-right p-3 font-semibold text-slate-700">Adjustment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {handicaps.map((player, index) => (
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
                          <span className="text-slate-900 font-medium">{player.name}</span>
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-slate-900">
                          {player.season_average.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-900">
                          {player.handicap_start_score}
                        </td>
                        <td className="p-3 text-right">
                          <span className={`font-medium ${
                            player.handicap_adjustment === 0 ? 'text-emerald-600' : 
                            player.handicap_adjustment < 0 ? 'text-rose-600' : 'text-slate-500'
                          }`}>
                            {player.handicap_adjustment > 0 ? '+' : ''}{player.handicap_adjustment}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {handicaps.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No handicap data available. Players need at least 3 sessions in the current season.
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
