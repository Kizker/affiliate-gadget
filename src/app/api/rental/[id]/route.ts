import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to find by ID first (CUID format)
    let rentalItem = await prisma.rentalItem.findUnique({
      where: { id },
    })

    // If not found by ID, try finding by name pattern
    if (!rentalItem) {
      // Convert slug-like ID back to name pattern
      let searchName = id
      if (searchName.startsWith('rental-')) {
        searchName = searchName.substring(7)
      }
      // Remove trailing hyphen
      if (searchName.endsWith('-')) {
        searchName = searchName.slice(0, -1)
      }
      // Replace hyphens with spaces for fuzzy search
      searchName = searchName.replace(/-/g, ' ')

      rentalItem = await prisma.rentalItem.findFirst({
        where: {
          name: { contains: searchName, mode: 'insensitive' },
          isActive: true,
        },
      })
    }

    if (!rentalItem) {
      return NextResponse.json(
        { error: 'Rental item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(rentalItem)
  } catch (error) {
    console.error('Error fetching rental item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rental item' },
      { status: 500 }
    )
  }
}
