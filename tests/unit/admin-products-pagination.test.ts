import { describe, it, expect } from 'vitest'

describe('Admin Products Pagination & Sorting Logic (Unit Tests)', () => {
  interface SampleProduct {
    id: string
    name: string
    price: number
    stock: number
    isActive: boolean
    createdAt: string
  }

  const sampleProducts: SampleProduct[] = [
    {
      id: '1',
      name: 'Google Pixel 10',
      price: 27000000,
      stock: 9,
      isActive: true,
      createdAt: '2026-09-14T09:15:00Z',
    },
    {
      id: '2',
      name: 'Blackberry Z10',
      price: 25000000,
      stock: 5,
      isActive: true,
      createdAt: '2026-09-14T08:50:00Z',
    },
    {
      id: '3',
      name: 'iPhone 16 Pro Max',
      price: 27000000,
      stock: 6,
      isActive: true,
      createdAt: '2026-09-11T03:00:00Z',
    },
    {
      id: '4',
      name: 'Find N3 Flip',
      price: 14999000,
      stock: 8,
      isActive: true,
      createdAt: '2026-09-07T05:37:00Z',
    },
    {
      id: '5',
      name: 'Vivo V30 Pro',
      price: 8999000,
      stock: 14,
      isActive: true,
      createdAt: '2026-09-07T05:36:00Z',
    },
    {
      id: '6',
      name: 'POCO F6 Pro',
      price: 8499000,
      stock: 16,
      isActive: true,
      createdAt: '2026-09-07T05:35:00Z',
    },
    {
      id: '7',
      name: 'Xiaomi 14',
      price: 11999000,
      stock: 17,
      isActive: true,
      createdAt: '2026-09-07T05:34:00Z',
    },
    {
      id: '8',
      name: 'ROG Phone 8 Pro',
      price: 15499000,
      stock: 9,
      isActive: true,
      createdAt: '2026-09-07T05:33:00Z',
    },
    {
      id: '9',
      name: 'Galaxy A55 5G',
      price: 5999000,
      stock: 27,
      isActive: true,
      createdAt: '2026-09-07T05:32:00Z',
    },
    {
      id: '10',
      name: 'Galaxy Z Fold 6',
      price: 26499000,
      stock: 4,
      isActive: false,
      createdAt: '2026-09-07T05:31:00Z',
    },
    {
      id: '11',
      name: 'Galaxy S24 Ultra',
      price: 21999000,
      stock: 7,
      isActive: true,
      createdAt: '2026-09-07T05:30:00Z',
    },
    {
      id: '12',
      name: 'iPhone 14',
      price: 12499000,
      stock: 21,
      isActive: true,
      createdAt: '2026-09-07T05:29:00Z',
    },
    {
      id: '13',
      name: 'iPhone 15 Pro Max',
      price: 26999000,
      stock: 3,
      isActive: true,
      createdAt: '2026-09-07T05:28:00Z',
    },
    {
      id: '14',
      name: 'Vivo X100 Pro',
      price: 16999000,
      stock: 3,
      isActive: true,
      createdAt: '2026-09-07T05:27:00Z',
    },
  ]

  it('should slice data correctly into 10 items per page by default', () => {
    const itemsPerPage = 10
    const currentPage = 1
    const totalItems = sampleProducts.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
    const page1 = sampleProducts.slice(startIndex, endIndex)

    expect(totalItems).toBe(14)
    expect(totalPages).toBe(2)
    expect(page1.length).toBe(10)
    expect(page1[0].name).toBe('Google Pixel 10')
    expect(page1[9].name).toBe('Galaxy Z Fold 6')
  })

  it('should navigate to page 2 and show remaining 4 items', () => {
    const itemsPerPage = 10
    const currentPage = 2
    const totalItems = sampleProducts.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
    const page2 = sampleProducts.slice(startIndex, endIndex)

    expect(totalPages).toBe(2)
    expect(page2.length).toBe(4)
    expect(startIndex + 1).toBe(11)
    expect(endIndex).toBe(14)
    expect(page2[0].name).toBe('Galaxy S24 Ultra')
    expect(page2[3].name).toBe('Vivo X100 Pro')
  })

  it('should sort products by latest (newest first) by default', () => {
    const sorted = [...sampleProducts].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    expect(sorted[0].name).toBe('Google Pixel 10')
    expect(sorted[1].name).toBe('Blackberry Z10')
    expect(sorted[2].name).toBe('iPhone 16 Pro Max')
  })

  it('should sort products by price descending and ascending', () => {
    const sortedDesc = [...sampleProducts].sort((a, b) => b.price - a.price)
    expect(sortedDesc[0].price).toBe(27000000)

    const sortedAsc = [...sampleProducts].sort((a, b) => a.price - b.price)
    expect(sortedAsc[0].name).toBe('Galaxy A55 5G')
    expect(sortedAsc[0].price).toBe(5999000)
  })

  it('should filter by active status', () => {
    const activeOnly = sampleProducts.filter((p) => p.isActive)
    const inactiveOnly = sampleProducts.filter((p) => !p.isActive)

    expect(activeOnly.length).toBe(13)
    expect(inactiveOnly.length).toBe(1)
    expect(inactiveOnly[0].name).toBe('Galaxy Z Fold 6')
  })
})
