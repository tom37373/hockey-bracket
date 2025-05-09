"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, RefreshCw } from "lucide-react"
import { useBracketSimulationStore } from "@/stores/bracketSimulationStore"
import { Team, BracketMatchup, FamilyMember } from "@/types"

// Local type for matchups with team objects
type Matchup = BracketMatchup & {
  team1?: Team;
  team2?: Team;
};

export default function TournamentBracket() {
  // State for selected family member
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedMember, setSelectedMember] = useState<string>("")
  const [selectedMemberId, setSelectedMemberId] = useState<string>("")
  const [teams, setTeams] = useState<Team[]>([])
  const [matchups, setMatchups] = useState<Matchup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Simulation store
  const { 
    simulatedMatchups, 
    isSimulationMode, 
    setOriginalMatchups, 
    incrementScore, 
    decrementScore, 
    resetSimulation, 
    toggleSimulationMode,
    setFamilyMembers: setStoreFamilyMembers,
    setConfidenceRatings,
    saveSimulatedMatchups
  } = useBracketSimulationStore()
  
  // Fetch family members, teams and matchups data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch family members
        const familyResponse = await fetch('/api/family-members')
        if (!familyResponse.ok) {
          throw new Error('Failed to fetch family members')
        }
        const familyData = await familyResponse.json()
        setFamilyMembers(familyData)
        
        // Set family members in the simulation store
        setStoreFamilyMembers(familyData)
        
        // Set default selected member
        if (familyData.length > 0) {
          setSelectedMember(familyData[0].name)
          setSelectedMemberId(familyData[0].id)
        }
        
        // Fetch teams
        const teamsResponse = await fetch('/api/teams')
        if (!teamsResponse.ok) {
          throw new Error('Failed to fetch teams')
        }
        const teamsData = await teamsResponse.json()
        
        // Fetch matchups
        const matchupsResponse = await fetch('/api/bracket-matchups')
        if (!matchupsResponse.ok) {
          throw new Error('Failed to fetch bracket matchups')
        }
        const matchupsData = await matchupsResponse.json()
        
        // Fetch all confidence ratings for the simulation store
        const allRatingsResponse = await fetch('/api/confidence-ratings')
        if (!allRatingsResponse.ok) {
          throw new Error('Failed to fetch all confidence ratings')
        }
        const allRatingsData = await allRatingsResponse.json()
        
        // Set confidence ratings in the simulation store
        setConfidenceRatings(allRatingsData)
        
        // If we have a selected member ID, fetch their confidence ratings
        if (familyData.length > 0) {
          const defaultMemberId = familyData[0].id
          
          // Fetch confidence ratings for selected member
          const ratingsResponse = await fetch(`/api/confidence-ratings?familyMemberId=${defaultMemberId}`)
          if (!ratingsResponse.ok) {
            throw new Error('Failed to fetch confidence ratings')
          }
          const ratingsData = await ratingsResponse.json()
          
          // Create a map of team IDs to confidence ratings
          const ratingsMap = new Map(ratingsData.map((rating: any) => [rating.teamId, rating.rating]))
          
          // Add confidence ratings to teams
          const teamsWithRatings = teamsData.map((team: any) => ({
            ...team,
            confidenceRating: ratingsMap.get(team.id) || 0
          })) as Team[]
          
          setTeams(teamsWithRatings)
          
          // Process matchups to include team objects
          const processedMatchups = matchupsData.map((matchup: any) => {
            const team1 = matchup.team1Id ? teamsWithRatings.find((t: any) => t.id === matchup.team1Id) : undefined
            const team2 = matchup.team2Id ? teamsWithRatings.find((t: any) => t.id === matchup.team2Id) : undefined
            
            return {
              ...matchup,
              team1,
              team2
            }
          }) as Matchup[]
          
          setMatchups(processedMatchups)
          
          // Set original matchups in the simulation store
          setOriginalMatchups(processedMatchups)
        }
      } catch (err) {
        setError('Error loading bracket data')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [setOriginalMatchups, setStoreFamilyMembers, setConfidenceRatings])
  
  // Update teams and matchups when selected member changes
  useEffect(() => {
    const updateRatings = async () => {
      if (!selectedMemberId) return
      
      try {
        // Fetch confidence ratings for selected member
        const ratingsResponse = await fetch(`/api/confidence-ratings?familyMemberId=${selectedMemberId}`)
        if (!ratingsResponse.ok) {
          throw new Error('Failed to fetch confidence ratings')
        }
        const ratingsData = await ratingsResponse.json()
        
        // Create a map of team IDs to confidence ratings
        const ratingsMap = new Map(ratingsData.map((rating: any) => [rating.teamId, rating.rating]))
        
        // Add confidence ratings to teams
        const teamsWithRatings = teams.map((team: any) => ({
          ...team,
          confidenceRating: ratingsMap.get(team.id) || 0
        })) as Team[]
        
        setTeams(teamsWithRatings)
        
        // Update matchups with new team ratings
        const updatedMatchups = matchups.map((matchup) => {
          const team1 = matchup.team1?.id ? teamsWithRatings.find((t: any) => t.id === matchup.team1?.id) : undefined
          const team2 = matchup.team2?.id ? teamsWithRatings.find((t: any) => t.id === matchup.team2?.id) : undefined
          
          return {
            ...matchup,
            team1,
            team2
          }
        }) as Matchup[]
        
        setMatchups(updatedMatchups)
      } catch (err) {
        console.error('Error updating ratings:', err)
      }
    }
    
    updateRatings()
  }, [selectedMemberId, teams.length])
  
  // Update selected member ID when selected member changes
  useEffect(() => {
    if (!selectedMember || familyMembers.length === 0) return
    
    const member = familyMembers.find(m => m.name === selectedMember)
    if (member) {
      setSelectedMemberId(member.id)
    }
  }, [selectedMember, familyMembers])
  
  // Group matchups by round - use simulated matchups when in simulation mode
  const displayMatchups = isSimulationMode ? simulatedMatchups as Matchup[] : matchups
  
  const matchupsByRound = [1, 2, 3, 4].map(round => 
    displayMatchups.filter(matchup => matchup.round === round)
  )
  
  // Round names
  const roundNames = ["First Round", "Second Round", "Conference Finals", "Stanley Cup Final"]
  
  // Component for displaying a team in the bracket
  const TeamDisplay = ({ 
    team, 
    score, 
    isWinner,
    matchupId,
    isTeam1
  }: { 
    team?: Team; 
    score?: number | null; 
    isWinner?: boolean;
    matchupId: number;
    isTeam1: boolean;
  }) => {
    if (!team) return <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded"></div>
    
    // Get confidence rating for the selected family member
    const confidenceRating = team.confidenceRating
    
    // Determine color based on confidence rating
    const ratingColor = confidenceRating && confidenceRating >= 8 ? "text-green-600" : 
                        confidenceRating && confidenceRating <= 3 ? "text-red-600" : 
                        "text-blue-600"
    
    return (
      <div
        className={`flex justify-between items-center p-2 rounded ${
          team.isEliminated
            ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            : isWinner
            ? "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500"
            : "bg-white dark:bg-gray-800"
        }`}
      >
        <div className="flex items-center">
          <div className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full mr-2 text-xs font-bold">
            {team.seed}
          </div>
          <span className={team.isEliminated ? "line-through" : ""}>{team.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {confidenceRating && (
            <div className={`font-bold ${ratingColor} px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs`}>
              {confidenceRating}
            </div>
          )}
          
          {/* Score display with controls when in simulation mode */}
          <div className="flex items-center">
            {isSimulationMode && (
              <button 
                onClick={() => incrementScore(matchupId, isTeam1)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                disabled={score === 4}
                aria-label="Increment score"
              >
                <ChevronUp size={14} />
              </button>
            )}
            
            {score !== null && score !== undefined && (
              <div className="font-bold px-2">{score}</div>
            )}
            
            {isSimulationMode && (
              <button 
                onClick={() => decrementScore(matchupId, isTeam1)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                disabled={!score || score <= 0}
                aria-label="Decrement score"
              >
                <ChevronDown size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // Component for displaying a matchup in the bracket
  const MatchupDisplay = ({ matchup }: { matchup: Matchup }) => {
    return (
      <div className="flex flex-col gap-1 mb-4">
        <TeamDisplay
          team={matchup.team1}
          score={matchup.score1}
          isWinner={matchup.isCompleted && matchup.winnerId === matchup.team1?.id}
          matchupId={matchup.id}
          isTeam1={true}
        />
        <TeamDisplay
          team={matchup.team2}
          score={matchup.score2}
          isWinner={matchup.isCompleted && matchup.winnerId === matchup.team2?.id}
          matchupId={matchup.id}
          isTeam1={false}
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Playoff Bracket</CardTitle>
              <CardDescription>Current playoff matchups and confidence ratings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Playoff Bracket</CardTitle>
              <CardDescription>Current playoff matchups and confidence ratings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Playoff Bracket</CardTitle>
            <CardDescription>Current playoff matchups and confidence ratings</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Simulation mode toggle */}
            <Button 
              variant={isSimulationMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSimulationMode}
            >
              {isSimulationMode ? "Exit Simulation" : "Simulate Games"}
            </Button>
            
            {/* Update button (only visible in simulation mode) */}
            {isSimulationMode && (
              <Button
                variant="default"
                size="sm"
                onClick={async () => {
                  const success = await saveSimulatedMatchups();
                  if (success) {
                    alert("Bracket updated successfully!");
                  } else {
                    alert("Failed to update bracket. Please try again.");
                  }
                }}
              >
                Update Bracket
              </Button>
            )}
            
            {/* Reset button (only visible in simulation mode) */}
            {isSimulationMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetSimulation}
              >
                <RefreshCw size={14} className="mr-1" />
                Reset
              </Button>
            )}
            
            <span className="text-sm font-medium">Show ratings for:</span>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {familyMembers.map((member) => (
                  <SelectItem key={member.id} value={member.name}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[900px] p-4">
            <div className="flex justify-between">
              {matchupsByRound.map((roundMatchups, roundIndex) => (
                <div key={roundIndex} className="flex flex-col" style={{ width: `${100 / matchupsByRound.length}%` }}>
                  <h3 className="text-center font-bold mb-4">{roundNames[roundIndex]}</h3>
                  <div 
                    className="flex flex-col justify-around h-full" 
                    style={{ 
                      minHeight: roundIndex === 0 ? "400px" : roundIndex === 1 ? "400px" : roundIndex === 2 ? "400px" : "400px"
                    }}
                  >
                    {roundMatchups.map((matchup) => (
                      <div key={matchup.id} className="relative flex items-center">
                        <div className="w-full">
                          <MatchupDisplay matchup={matchup} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm">Winner</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-300 dark:bg-gray-700 rounded-full mr-2"></div>
            <span className="text-sm line-through">Eliminated</span>
          </div>
          <div className="flex items-center">
            <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-bold text-green-600 mr-2">8+</div>
            <span className="text-sm">High confidence</span>
          </div>
          <div className="flex items-center">
            <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-bold text-red-600 mr-2">1-3</div>
            <span className="text-sm">Low confidence</span>
          </div>
          {isSimulationMode && (
            <div className="flex items-center">
              <div className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 rounded-full text-xs font-bold text-blue-600 mr-2">
                Simulation Mode
              </div>
              <span className="text-sm">Use arrows to adjust scores</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
