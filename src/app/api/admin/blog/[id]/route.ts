import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Only ADMIN and SUPER_ADMIN can access
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const article = await prisma.article.findUnique({
      where: { id },
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Only ADMIN and SUPER_ADMIN can update articles
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()

    // Check if article exists
    const existing = await prisma.article.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Check if slug is being changed and if it already exists
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await prisma.article.findUnique({
        where: { slug: body.slug },
      })
      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    // Update article
    const article = await prisma.article.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.slug && { slug: body.slug }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.excerpt !== undefined && { excerpt: body.excerpt }),
        ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.isPublished !== undefined && {
          isPublished: body.isPublished,
        }),
        ...(body.publishedAt !== undefined && {
          publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
        }),
      },
    })

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Only SUPER_ADMIN can delete articles
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Check if article exists
    const existing = await prisma.article.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Delete article
    await prisma.article.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Article deleted successfully' })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
