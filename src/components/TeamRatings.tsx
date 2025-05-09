"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define types
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

type TeamRating = {
  [teamId: number]: number;
};

type FamilyRatings = {
  [member: string]: TeamRating;
};

export default function TeamRatings() {
  const [filter, setFilter] = useState("all")
  const [teams, setTeams] = useState<Team[]>([])
  const [bracketMatchups, setBracketMatchups] = useState<any[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [teamRatings, setTeamRatings] = useState<FamilyRatings>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
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
        setBracketMatchups(matchupsData)
        
        // Sort teams based on bracket order
        const bracketTeamIds: number[] = []
        
        // First get all team IDs from round 1 matchups in order
        matchupsData
          .filter((matchup: any) => matchup.round === 1)
          .sort((a: any, b: any) => a.position - b.position)
          .forEach((matchup: any) => {
            if (matchup.team1Id) bracketTeamIds.push(matchup.team1Id)
            if (matchup.team2Id) bracketTeamIds.push(matchup.team2Id)
          })
        
        // Then add any teams from later rounds that might not be in round 1
        matchupsData
          .filter((matchup: any) => matchup.round > 1)
          .forEach((matchup: any) => {
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
        
        // Fetch family members
        const familyResponse = await fetch('/api/family-members')
        if (!familyResponse.ok) {
          throw new Error('Failed to fetch family members')
        }
        const familyData = await familyResponse.json()
        setFamilyMembers(familyData)
        
        // Fetch confidence ratings
        const ratingsResponse = await fetch('/api/confidence-ratings')
        if (!ratingsResponse.ok) {
          throw new Error('Failed to fetch confidence ratings')
        }
        const ratingsData = await ratingsResponse.json()
        
        // Process ratings into the format we need
        const processedRatings: FamilyRatings = {}
        
        // Initialize the structure
        familyData.forEach((member: FamilyMember) => {
          processedRatings[member.name] = {}
          teamsData.forEach((team: Team) => {
            processedRatings[member.name][team.id] = 0
          })
        })
        
        // Fill in the ratings
        ratingsData.forEach((rating: ConfidenceRating) => {
          const member = familyData.find((m: FamilyMember) => m.id === rating.familyMemberId)
          if (member) {
            processedRatings[member.name][rating.teamId] = rating.rating
          }
        })
        
        setTeamRatings(processedRatings)
        setIsLoading(false)
      } catch (err) {
        setError('Error loading team ratings')
        console.error(err)
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const filteredTeams = teams.filter((team) => {
    if (filter === "all") return true
    if (filter === "eastern") return team.conference === "Eastern"
    if (filter === "western") return team.conference === "Western"
    if (filter === "atlantic") return team.division === "Atlantic"
    if (filter === "metropolitan") return team.division === "Metropolitan"
    if (filter === "central") return team.division === "Central"
    if (filter === "pacific") return team.division === "Pacific"
    return true
  })
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Team Confidence Ratings (1-10)</CardTitle>
              <CardDescription>See how everyone rated each team</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Team Confidence Ratings (1-10)</CardTitle>
              <CardDescription>See how everyone rated each team</CardDescription>
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
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Team Confidence Ratings (1-10)</CardTitle>
            <CardDescription>See how everyone rated each team</CardDescription>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="eastern">Eastern Conference</SelectItem>
              <SelectItem value="western">Western Conference</SelectItem>
              <SelectItem value="atlantic">Atlantic Division</SelectItem>
              <SelectItem value="metropolitan">Metropolitan Division</SelectItem>
              <SelectItem value="central">Central Division</SelectItem>
              <SelectItem value="pacific">Pacific Division</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Team</TableHead>
                {familyMembers.map((member) => (
                  <TableHead key={member.id} className="text-center">
                    {member.name}
                  </TableHead>
                ))}
                <TableHead className="text-center">Avg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => {
                // Calculate average rating for this team
                const memberNames = familyMembers.map(member => member.name);
                const validRatings = memberNames.filter(member => 
                  teamRatings[member] && typeof teamRatings[member][team.id] === 'number'
                );
                
                const avgRating = validRatings.length > 0 
                  ? validRatings.reduce((sum, member) => sum + (teamRatings[member]?.[team.id] || 0), 0) / validRatings.length
                  : 0;
                
                return (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    {familyMembers.map((member) => {
                      const rating = teamRatings[member.name]?.[team.id] || 0;
                      return (
                        <TableCell key={`${team.id}-${member.id}`} className="text-center">
                          <span
                            className={`font-bold ${rating >= 8 ? "text-green-600" : rating <= 3 ? "text-red-600" : ""}`}
                          >
                            {rating}
                          </span>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-bold">
                      {avgRating.toFixed(1)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
