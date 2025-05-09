"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define types
type Game = {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore?: number;
  awayScore?: number;
  status: 'live' | 'upcoming' | 'final';
  period?: string;
  timeRemaining?: string;
  date?: string;
  time?: string;
  // These fields are added after fetching from API
  homeTeam?: string;
  awayTeam?: string;
};

export default function LiveScores() {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())
  const [liveGames, setLiveGames] = useState<Game[]>([])
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([])
  const [completedGames, setCompletedGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Update the time every second for the "Last updated" display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)

    return () => clearInterval(interval)
  }, [])
  
  // Fetch games data
  useEffect(() => {
    const fetchGames = async () => {
      try {
        // Fetch teams first to get team names
        const teamsResponse = await fetch('/api/teams')
        if (!teamsResponse.ok) {
          throw new Error('Failed to fetch teams')
        }
        const teamsData = await teamsResponse.json()
        
        // Create a map of team IDs to team names
        const teamMap = new Map(teamsData.map((team: any) => [team.id, team.name]))
        
        // Fetch live games
        const liveResponse = await fetch('/api/games?status=live')
        if (!liveResponse.ok) {
          throw new Error('Failed to fetch live games')
        }
        const liveData = await liveResponse.json()
        
        // Add team names to games
        const liveGamesWithTeams = liveData.map((game: Game) => ({
          ...game,
          homeTeam: teamMap.get(game.homeTeamId),
          awayTeam: teamMap.get(game.awayTeamId)
        }))
        
        setLiveGames(liveGamesWithTeams)
        
        // Fetch upcoming games
        const upcomingResponse = await fetch('/api/games?status=upcoming')
        if (!upcomingResponse.ok) {
          throw new Error('Failed to fetch upcoming games')
        }
        const upcomingData = await upcomingResponse.json()
        
        // Add team names to games
        const upcomingGamesWithTeams = upcomingData.map((game: Game) => ({
          ...game,
          homeTeam: teamMap.get(game.homeTeamId),
          awayTeam: teamMap.get(game.awayTeamId)
        }))
        
        setUpcomingGames(upcomingGamesWithTeams)
        
        // Fetch completed games
        const completedResponse = await fetch('/api/games?status=completed')
        if (!completedResponse.ok) {
          throw new Error('Failed to fetch completed games')
        }
        const completedData = await completedResponse.json()
        
        // Add team names to games
        const completedGamesWithTeams = completedData.map((game: Game) => ({
          ...game,
          homeTeam: teamMap.get(game.homeTeamId),
          awayTeam: teamMap.get(game.awayTeamId)
        }))
        
        setCompletedGames(completedGamesWithTeams)
      } catch (err) {
        setError('Error loading games')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchGames()
  }, [])

  
  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Live Scores</CardTitle>
                <CardDescription>Last updated: {currentTime}</CardDescription>
              </div>
              <Badge variant="outline" className="animate-pulse bg-red-50">
                LIVE
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Live Scores</CardTitle>
                <CardDescription>Last updated: {currentTime}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-red-500">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Live Scores</CardTitle>
              <CardDescription>Last updated: {currentTime}</CardDescription>
            </div>
            <Badge variant="outline" className="animate-pulse bg-red-50">
              LIVE
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="live">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="live">Live Games</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming Games</TabsTrigger>
              <TabsTrigger value="completed">Completed Games</TabsTrigger>
            </TabsList>

            <TabsContent value="live">
              {liveGames.length > 0 ? (
                <div className="grid gap-4">
                  {liveGames.map((game) => (
                    <div key={game.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="destructive" className="animate-pulse">
                          LIVE
                        </Badge>
                        <div className="text-sm font-medium">
                          {game.period} Period • {game.timeRemaining} remaining
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 items-center mt-4">
                        <div className="text-center">
                          <div className="text-lg font-medium">{game.awayTeam}</div>
                          <div className="text-3xl font-bold mt-2">{game.awayScore}</div>
                        </div>

                        <div className="text-center text-xl font-bold text-muted-foreground">VS</div>

                        <div className="text-center">
                          <div className="text-lg font-medium">{game.homeTeam}</div>
                          <div className="text-3xl font-bold mt-2">{game.homeScore}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No live games at the moment</div>
              )}
            </TabsContent>

            <TabsContent value="upcoming">
              {upcomingGames.length > 0 ? (
                <div className="grid gap-4">
                  {upcomingGames.map((game) => (
                    <div key={game.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                          UPCOMING
                        </Badge>
                        <div className="text-sm font-medium">
                          {game.date} • {game.time}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 items-center mt-4">
                        <div className="text-center">
                          <div className="text-lg font-medium">{game.awayTeam}</div>
                        </div>

                        <div className="text-center text-xl font-bold text-muted-foreground">VS</div>

                        <div className="text-center">
                          <div className="text-lg font-medium">{game.homeTeam}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No upcoming games scheduled</div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              <div className="grid gap-4">
                {completedGames.map((game) => (
                  <div key={game.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant="outline">FINAL</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-center mt-4">
                      <div className="text-center">
                        <div className="text-lg font-medium">{game.awayTeam}</div>
                        <div className="text-3xl font-bold mt-2">{game.awayScore}</div>
                      </div>

                      <div className="text-center text-xl font-bold text-muted-foreground">VS</div>

                      <div className="text-center">
                        <div className="text-lg font-medium">{game.homeTeam}</div>
                        <div className="text-3xl font-bold mt-2">{game.homeScore}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
