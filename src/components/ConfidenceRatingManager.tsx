"use client"

import { useState, useEffect } from "react"
import { BracketMatchup } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

type FamilyMember = {
  id: string;
  name: string;
};

type Team = {
  id: number;
  name: string;
  conference: string;
  division: string;
  seed: number;
  isEliminated: boolean;
};

type ConfidenceRating = {
  familyMemberId: string;
  teamId: number;
  rating: number;
};

export default function ConfidenceRatingManager() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  // We use bracketMatchups indirectly for sorting teams, but don't need to track it in state
  // const [bracketMatchups, setBracketMatchups] = useState<BracketMatchup[]>([])
  const [ratings, setRatings] = useState<ConfidenceRating[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch data
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
        
        // Set default selected member if available
        if (familyData.length > 0 && !selectedMemberId) {
          setSelectedMemberId(familyData[0].id)
        }
        
        // Fetch teams
        const teamsResponse = await fetch('/api/teams')
        if (!teamsResponse.ok) {
          throw new Error('Failed to fetch teams')
        }
        const teamsData = await teamsResponse.json()
        
        // Fetch bracket matchups to get team order
        const matchupsResponse = await fetch('/api/bracket-matchups')
        if (!matchupsResponse.ok) {
          throw new Error('Failed to fetch bracket matchups')
        }
        const matchupsData = await matchupsResponse.json()
        // We don't need to store the matchups in state anymore
        // setBracketMatchups(matchupsData)
        
        // Sort teams based on bracket order
        const bracketTeamIds: number[] = []
        
        // First get all team IDs from round 1 matchups in order
        matchupsData
          .filter((matchup: BracketMatchup) => matchup.round === 1)
          .sort((a: BracketMatchup, b: BracketMatchup) => a.position - b.position)
          .forEach((matchup: BracketMatchup) => {
            if (matchup.team1Id) bracketTeamIds.push(matchup.team1Id)
            if (matchup.team2Id) bracketTeamIds.push(matchup.team2Id)
          })
        
        // Then add any teams from later rounds that might not be in round 1
        matchupsData
          .filter((matchup: BracketMatchup) => matchup.round > 1)
          .forEach((matchup: BracketMatchup) => {
            if (matchup.team1Id && !bracketTeamIds.includes(matchup.team1Id)) {
              bracketTeamIds.push(matchup.team1Id)
            }
            if (matchup.team2Id && !bracketTeamIds.includes(matchup.team2Id)) {
              bracketTeamIds.push(matchup.team2Id)
            }
          })
        
        // Sort teams based on bracket order
        const sortedTeams = [...teamsData].sort((a: Team, b: Team) => {
          const indexA = bracketTeamIds.indexOf(a.id)
          const indexB = bracketTeamIds.indexOf(b.id)
          
          // If both teams are in the bracket, sort by their position
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB
          }
          
          // If only one team is in the bracket, prioritize it
          if (indexA !== -1) return -1
          if (indexB !== -1) return 1
          
          // If neither team is in the bracket, sort by conference, division, and seed
          if (a.conference !== b.conference) {
            return a.conference === "Eastern" ? -1 : 1
          }
          if (a.division !== b.division) {
            return a.division.localeCompare(b.division)
          }
          return a.seed - b.seed
        })
        
        setTeams(sortedTeams)
        
        setIsLoading(false)
      } catch (err) {
        setError('Error loading data')
        console.error(err)
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [selectedMemberId])
  
  // Fetch ratings when selected member changes
  useEffect(() => {
    if (!selectedMemberId) return
    
    const fetchRatings = async () => {
      try {
        const response = await fetch(`/api/confidence-ratings?familyMemberId=${selectedMemberId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch confidence ratings')
        }
        const data = await response.json()
        setRatings(data)
      } catch (err) {
        toast.error("Failed to load confidence ratings")
        console.error(err)
      }
    }
    
    fetchRatings()
  }, [selectedMemberId])
  
  // Update a rating
  const updateRating = async (teamId: number, newRating: number) => {
    if (!selectedMemberId) return
    
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/confidence-ratings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          familyMemberId: selectedMemberId,
          teamId,
          rating: newRating
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update rating')
      }
      
      // Update local state
      setRatings(prevRatings => 
        prevRatings.map(rating => 
          rating.familyMemberId === selectedMemberId && rating.teamId === teamId
            ? { ...rating, rating: newRating }
            : rating
        )
      )
      
      toast.success("Rating updated")
    } catch (err) {
      toast.error("Failed to update rating")
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }
  
  // Get rating for a team
  const getRatingForTeam = (teamId: number): number => {
    const rating = ratings.find(r => 
      r.familyMemberId === selectedMemberId && r.teamId === teamId
    )
    return rating ? rating.rating : 5 // Default to 5 if not found
  }
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="text-center py-8 text-red-500">{error}</div>
    )
  }
  
  if (familyMembers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No family members found. Please add family members first.
      </div>
    )
  }
  
  return (
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Select Family Member
        </label>
        <Select
          value={selectedMemberId}
          onValueChange={setSelectedMemberId}
          disabled={isSaving}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a family member" />
          </SelectTrigger>
          <SelectContent>
            {familyMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {selectedMemberId && (
        <div>
          <h3 className="text-lg font-medium mb-4">
            Confidence Ratings (1-10)
          </h3>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Conference</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => {
                const currentRating = getRatingForTeam(team.id)
                
                return (
                  <TableRow key={team.id} className={team.isEliminated ? "opacity-50" : ""}>
                    <TableCell className="font-medium">
                      {team.name}
                      {team.isEliminated && <span className="ml-2 text-red-500">(Eliminated)</span>}
                    </TableCell>
                    <TableCell>{team.conference}</TableCell>
                    <TableCell>{team.division}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${
                        currentRating >= 8 ? "text-green-600" : 
                        currentRating <= 3 ? "text-red-600" : ""
                      }`}>
                        {currentRating}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                          <Button
                            key={rating}
                            variant={currentRating === rating ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => updateRating(team.id, rating)}
                            disabled={isSaving}
                          >
                            {rating}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
