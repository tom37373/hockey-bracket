"use client"

import { useEffect, useState } from "react"
import { useBracketSimulationStore, BracketOdds as BracketOddsType } from "@/stores/bracketSimulationStore"

export default function BracketOdds() {
  const [odds, setOdds] = useState<BracketOddsType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Get simulation store
  const { 
    isSimulationMode, 
    calculateBracketOdds,
    simulatedMatchups,
    originalMatchups
  } = useBracketSimulationStore()
  
  useEffect(() => {
    // Delay fetching odds to allow the rest of the page to load first
    const fetchOdds = async () => {
      try {
        // Set a timeout to delay the API call
        setTimeout(async () => {
          const response = await fetch('/api/bracket-odds?includeNames=true')
          if (!response.ok) {
            throw new Error('Failed to fetch bracket odds')
          }
          const data = await response.json()
          setOdds(data)
          setIsLoading(false)
        }, 500) // 500ms delay to allow other components to load first
      } catch (err) {
        setError('Error loading bracket odds')
        console.error(err)
        setIsLoading(false)
      }
    }
    
    fetchOdds()
  }, [])
  
  // Update odds when simulation mode changes or matchups change
  useEffect(() => {
    // Only recalculate if we have data loaded and we're not in the initial loading state
    if (originalMatchups.length > 0 && !isLoading) {
      const calculatedOdds = calculateBracketOdds()
      setOdds(calculatedOdds)
    }
  }, [isSimulationMode, simulatedMatchups, originalMatchups, calculateBracketOdds, isLoading])
  
  // Sort odds from highest to lowest
  const sortedOdds = [...odds].sort((a, b) => b.odds - a.odds)
  
  // Calculate color based on odds
  const getTextColorClass = (odds: number) => {
    if (odds >= 25) return "text-green-600"
    if (odds >= 20) return "text-blue-600"
    if (odds >= 15) return "text-yellow-600"
    return "text-red-600"
  }
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium mb-2">Bracket Winning Odds</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium mb-2">Bracket Winning Odds</h3>
        <p className="text-xs text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
      <h3 className="text-sm font-medium mb-2">
        Bracket Winning Odds
        {isSimulationMode && <span className="ml-2 text-xs text-blue-600">(Simulation)</span>}
      </h3>
      <div className="flex flex-wrap gap-2">
        {sortedOdds.map((item) => (
          <div key={item.familyMemberId} className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
            <span className="text-xs">{item.name}:</span>
            <span className={`text-xs font-bold ${getTextColorClass(item.odds)}`}>
              {item.odds < 10 ? item.odds.toFixed(1) : item.odds}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
