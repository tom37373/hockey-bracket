"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FamilyMemberManager from "@/components/FamilyMemberManager"
import ConfidenceRatingManager from "@/components/ConfidenceRatingManager"

export default function ManagePage() {
  const [activeTab, setActiveTab] = useState("family-members")
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manage Hockey Bracket
          </h1>
          <Link 
            href="/" 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="family-members">Family Members</TabsTrigger>
              <TabsTrigger value="confidence-ratings">Confidence Ratings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="family-members">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Family Members</CardTitle>
                  <CardDescription>
                    Add or remove family members from the hockey bracket pool
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FamilyMemberManager />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="confidence-ratings">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Confidence Ratings</CardTitle>
                  <CardDescription>
                    Update confidence ratings for each family member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ConfidenceRatingManager />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <footer className="bg-white dark:bg-gray-800 shadow mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 dark:text-gray-400">
            Family Hockey Bracket © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  )
}
