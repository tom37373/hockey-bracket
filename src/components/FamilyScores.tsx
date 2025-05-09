"use client"

import { useEffect, useState } from "react"
import { useBracketSimulationStore, FamilyScore } from "@/stores/bracketSimulationStore"

export default function FamilyScores() {
  const [scores, setScores] = useState<FamilyScore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Get simulation store
  const { 
    isSimulationMode, 
    calculateFamilyScores, 
    setFamilyMembers, 
    setConfidenceRatings,
    simulatedMatchups,
    originalMatchups
  } = useBracketSimulationStore()
  
  // Fetch family members and confidence ratings
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch family members
        const familyResponse = await fetch('/api/family-members')
        if (!familyResponse.ok) {
          throw new Error('Failed to fetch family members')
        }
        const familyData = await familyResponse.json()
        
        // Store family members in the simulation store
        setFamilyMembers(familyData)
        
        // Fetch all confidence ratings
        const ratingsResponse = await fetch('/api/confidence-ratings')
        if (!ratingsResponse.ok) {
          throw new Error('Failed to fetch confidence ratings')
        }
        const ratingsData = await ratingsResponse.json()
        
        // Store confidence ratings in the simulation store
        setConfidenceRatings(ratingsData)
        
        // Fetch scores from API for initial load
        const scoresResponse = await fetch('/api/family-scores')
        if (!scoresResponse.ok) {
          throw new Error('Failed to fetch family scores')
        }
        const scoresData = await scoresResponse.json()
        setScores(scoresData)
      } catch (err) {
        setError('Error loading family scores')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [setFamilyMembers, setConfidenceRatings])
  
  // Update scores when simulation mode changes or matchups change
  useEffect(() => {
    // Only recalculate if we have data loaded
    if (originalMatchups.length > 0) {
      const calculatedScores = calculateFamilyScores()
      setScores(calculatedScores)
    }
  }, [isSimulationMode, simulatedMatchups, originalMatchups, calculateFamilyScores])
  
  // Function to get color based on position
  const getPositionColor = (index: number) => {
    switch (index) {
      case 0: return "text-yellow-500"; // Gold for 1st
      case 1: return "text-gray-400";   // Silver for 2nd
      case 2: return "text-amber-600";  // Bronze for 3rd
      default: return "text-gray-600";  // Default for others
    }
  }
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
        <div className="animate-pulse flex justify-center space-x-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
        <p className="text-center text-red-500">{error}</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-6">
      <div className="flex justify-between items-center">
        {scores.map((score, index) => (
          <div 
            key={score.id} 
            className={`flex flex-col items-center ${
              index === 0 ? 'scale-110' : ''
            }`}
          >
            <div className={`text-4xl font-bold ${getPositionColor(index)}`}>
              {score.score}
            </div>
            <div className="text-lg font-medium mt-2">{score.name}</div>
            <div className={`text-sm mt-1 ${
              index === 0 ? 'font-bold text-yellow-500' : 'text-gray-500'
            }`}>
              {index === 0 ? 'LEADER' : `#${index + 1}`}
            </div>
          </div>
        ))}
      </div>
      {isSimulationMode && (
        <div className="mt-4 text-center text-sm text-blue-600 dark:text-blue-400 font-medium">
          Simulation Mode: Scores updated based on simulated bracket
        </div>
      )}
    </div>
  )
}
