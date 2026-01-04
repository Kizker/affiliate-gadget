import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to find by ID first (CUID format)
    let product = await prisma.product.findUnique({
      where: { id },
    })

    // If not found by ID, try finding by converting slug-like ID back to name
    if (!product) {
      // Convert slug like "product-airpods-pro-2nd-gen" to search pattern
      // Remove "product-" prefix if exists and replace hyphens with spaces
      let searchName = id
      if (searchName.startsWith('product-')) {
        searchName = searchName.substring(8)
      }
      // Remove trailing hyphen
      if (searchName.endsWith('-')) {
        searchName = searchName.slice(0, -1)
      }
      // Replace hyphens with spaces for fuzzy search
      searchName = searchName.replace(/-/g, ' ')

      product = await prisma.product.findFirst({
        where: {
          name: { contains: searchName, mode: 'insensitive' },
          isActive: true,
        },
      })
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
