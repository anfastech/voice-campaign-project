import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createMenuSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
  icon: z.string().optional(),
  position: z.number().int().optional(),
})

const updateMenuSchema = z.object({
  id: z.string(),
  label: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
  icon: z.string().optional(),
  position: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

const deleteMenuSchema = z.object({
  id: z.string(),
})

export async function GET() {
  try {
    const user = await requireAdmin()
    if (user instanceof NextResponse) return user

    const items = await prisma.customMenuItem.findMany({
      where: { userId: user.id },
      orderBy: { position: 'asc' },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Menu GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin()
    if (user instanceof NextResponse) return user

    const body = await req.json()
    const data = createMenuSchema.parse(body)

    const item = await prisma.customMenuItem.create({
      data: {
        ...data,
        position: data.position ?? 0,
        userId: user.id,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Menu POST error:', error)
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAdmin()
    if (user instanceof NextResponse) return user

    const body = await req.json()
    const { id, ...data } = updateMenuSchema.parse(body)

    const result = await prisma.customMenuItem.updateMany({
      where: { id, userId: user.id },
      data,
    })

    if (result.count === 0) return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Menu PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAdmin()
    if (user instanceof NextResponse) return user

    const body = await req.json()
    const { id } = deleteMenuSchema.parse(body)

    const result = await prisma.customMenuItem.deleteMany({
      where: { id, userId: user.id },
    })

    if (result.count === 0) return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Menu DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 })
  }
}
