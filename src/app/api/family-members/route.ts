import { NextResponse } from 'next/server';
import { getFamilyMembers, addFamilyMember, removeFamilyMember } from '@/utils/data';

export async function GET() {
  try {
    const familyMembers = getFamilyMembers();
    return NextResponse.json(familyMembers);
  } catch (error) {
    console.error('Error fetching family members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family members' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required and must be a string' },
        { status: 400 }
      );
    }
    
    const newMember = addFamilyMember(name);
    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Error adding family member:', error);
    return NextResponse.json(
      { error: 'Failed to add family member' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Family member ID is required' },
        { status: 400 }
      );
    }
    
    removeFamilyMember(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing family member:', error);
    return NextResponse.json(
      { error: 'Failed to remove family member' },
      { status: 500 }
    );
  }
}
