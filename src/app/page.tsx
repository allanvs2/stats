import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TargetIcon, TrophyIcon, UsersIcon, BarChart3Icon, ShieldIcon, StarIcon } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TargetIcon className="h-8 w-8 text-yellow-400" />
            <span className="text-2xl font-bold text-white">Darts Club Stats</span>
          </div>
          <div className="flex space-x-4">
            <Link href="/login">
              <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            Vikings & JDA
            <span className="block text-yellow-400">Darts Club Stats</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Professional dart statistics tracking for Vikings and JDA clubs. Monitor your performance, 
            analyze trends, and compete with fellow players using comprehensive data visualization.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signup">
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-3 text-lg">
                Join Your Club
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-black px-8 py-3 text-lg">
                Member Login
              </Button>
            </Link>
          </div>

          {/* Club Preview */}
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="vikings" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-lg">
                <TabsTrigger value="vikings" className="data-[state=active]:bg-white data-[state=active]:text-black text-white">
                  <ShieldIcon className="w-4 h-4 mr-2" />
                  Vikings Club
                </TabsTrigger>
                <TabsTrigger value="jda" className="data-[state=active]:bg-white data-[state=active]:text-black text-white">
                  <StarIcon className="w-4 h-4 mr-2" />
                  JDA Club
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="vikings" className="mt-6">
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center">
                      <ShieldIcon className="w-6 h-6 mr-2 text-yellow-400" />
                      Vikings Dart Club
                    </CardTitle>
                    <CardDescription className="text-gray-300 text-lg">
                      Friday sessions, match tracking, and member performance analytics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">180+</div>
                        <div className="text-gray-300">Friday Sessions</div>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">500+</div>
                        <div className="text-gray-300">Matches Tracked</div>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">25+</div>
                        <div className="text-gray-300">Active Members</div>
                      </div>
                    </div>
                    <div className="text-gray-300 mb-4">
                      <p className="mb-2">📊 <strong>Friday Sessions:</strong> Weekly performance tracking with detailed statistics</p>
                      <p className="mb-2">🎯 <strong>Match Results:</strong> Head-to-head competition records and averages</p>
                      <p className="mb-2">👥 <strong>Member Profiles:</strong> Individual player statistics and rankings</p>
                    </div>
                    <Link href="/signup">
                      <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">
                        Join Vikings Club
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="jda" className="mt-6">
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center">
                      <StarIcon className="w-6 h-6 mr-2 text-yellow-400" />
                      JDA Dart Club
                    </CardTitle>
                    <CardDescription className="text-gray-300 text-lg">
                      Comprehensive statistics, individual legs tracking, and bonus point system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">1000+</div>
                        <div className="text-gray-300">Individual Legs</div>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">300+</div>
                        <div className="text-gray-300">Matches Played</div>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">150+</div>
                        <div className="text-gray-300">Bonus Points</div>
                      </div>
                    </div>
                    <div className="text-gray-300 mb-4">
                      <p className="mb-2">📈 <strong>Detailed Analytics:</strong> Points, averages, and block positioning</p>
                      <p className="mb-2">🏆 <strong>Leg Tracking:</strong> Individual leg performance and dart counts</p>
                      <p className="mb-2">🎁 <strong>Bonus System:</strong> Extra points for exceptional performance</p>
                    </div>
                    <Link href="/signup">
                      <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">
                        Join JDA Club
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Professional Dart Statistics Platform
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-center">
              <CardHeader>
                <TrophyIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <CardTitle className="text-white">Performance Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  Monitor your dart game statistics, track averages, 180s, and performance improvements over time with detailed analytics.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-center">
              <CardHeader>
                <UsersIcon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <CardTitle className="text-white">Club Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  Join Vikings or JDA clubs, compete with fellow members, and climb the leaderboards with comprehensive ranking systems.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-center">
              <CardHeader>
                <BarChart3Icon className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <CardTitle className="text-white">Data Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  Beautiful charts and graphs to visualize your performance trends, match results, and statistical analysis.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Track Everything That Matters</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <div className="text-3xl font-bold text-yellow-400 mb-2">180s</div>
              <div className="text-gray-300">Maximum Scores</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <div className="text-3xl font-bold text-green-400 mb-2">AVG</div>
              <div className="text-gray-300">Dart Averages</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-400 mb-2">W/L</div>
              <div className="text-gray-300">Win Rates</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <div className="text-3xl font-bold text-purple-400 mb-2">PTS</div>
              <div className="text-gray-300">League Points</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Ready to Track Your Progress?</CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                Join Vikings or JDA dart club today and start analyzing your game like never before.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup" className="flex-1">
                  <Button size="lg" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">
                    Create Account
                  </Button>
                </Link>
                <Link href="/login" className="flex-1">
                  <Button size="lg" variant="outline" className="w-full text-white border-white hover:bg-white hover:text-black">
                    Member Login
                  </Button>
                </Link>
              </div>
              <p className="text-gray-400 text-sm mt-4">
                Already a member? Contact your club admin to get access to your statistics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/20 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 Vikings & JDA Darts Club Stats. Professional dart statistics platform.</p>
            <p className="mt-2">Track your performance • Analyze your game • Compete with the best</p>
          </div>
        </div>
      </footer>
    </div>
  )
}