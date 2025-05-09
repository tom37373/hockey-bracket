"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

type FamilyMember = {
  id: string;
  name: string;
};

export default function FamilyMemberManager() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [newMemberName, setNewMemberName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch family members
  useEffect(() => {
    const fetchFamilyMembers = async () => {
      try {
        const response = await fetch('/api/family-members')
        if (!response.ok) {
          throw new Error('Failed to fetch family members')
        }
        const data = await response.json()
        setFamilyMembers(data)
      } catch (err) {
        setError('Error loading family members')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchFamilyMembers()
  }, [])
  
  // Add a new family member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMemberName.trim()) {
      toast.error("Please enter a name")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/family-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newMemberName.trim() }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to add family member')
      }
      
      const newMember = await response.json()
      setFamilyMembers([...familyMembers, newMember])
      setNewMemberName("")
      toast.success(`${newMember.name} added successfully`)
    } catch (err) {
      toast.error("Failed to add family member")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Remove a family member
  const handleRemoveMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}? This will also delete their confidence ratings.`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/family-members?id=${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove family member')
      }
      
      setFamilyMembers(familyMembers.filter(member => member.id !== id))
      toast.success(`${name} removed successfully`)
    } catch (err) {
      toast.error("Failed to remove family member")
      console.error(err)
    }
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
  
  return (
    <div>
      <form onSubmit={handleAddMember} className="flex gap-4 mb-8">
        <Input
          type="text"
          placeholder="Enter name"
          value={newMemberName}
          onChange={(e) => setNewMemberName(e.target.value)}
          className="flex-1"
          disabled={isSubmitting}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Member"}
        </Button>
      </form>
      
      {familyMembers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No family members yet. Add your first member above.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {familyMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id, member.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
