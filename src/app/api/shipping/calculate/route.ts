import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import {
  calculateShippingOptions,
  ShippingLocation,
  ShippingItem,
} from '@/lib/shipping/shipping-engine'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const {
      storeId,
      addressId,
      weightGram,
      items = [],
      directOrigin,
      directDestination,
    } = body

    let originLocation: ShippingLocation = {}
    let destLocation: ShippingLocation = {}
    let storeName: string | undefined

    // 1. Resolve Store / Origin Location
    if (storeId) {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: {
          id: true,
          name: true,
          city: true,
          province: true,
          address: true,
          postalCode: true,
          latitude: true,
          longitude: true,
        },
      })

      if (store) {
        storeName = store.name
        originLocation = {
          latitude: store.latitude,
          longitude: store.longitude,
          city: store.city,
          province: store.province,
          postalCode: store.postalCode,
          fullAddress: store.address,
        }
      }
    }

    // Jika store belum ketemu dari storeId, coba ambil dari product pertama di items
    if (!originLocation.city && items.length > 0 && items[0].productId) {
      const product = await prisma.product.findUnique({
        where: { id: items[0].productId },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              city: true,
              province: true,
              address: true,
              postalCode: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      })

      if (product?.store) {
        storeName = product.store.name
        originLocation = {
          latitude: product.store.latitude,
          longitude: product.store.longitude,
          city: product.store.city,
          province: product.store.province,
          postalCode: product.store.postalCode,
          fullAddress: product.store.address,
        }
      }
    }

    // Fallback store default (Roxy Mas Jakarta Pusat) jika belum ada
    if (!originLocation.city && !originLocation.latitude) {
      if (directOrigin?.city || directOrigin?.latitude) {
        originLocation = directOrigin
      } else {
        const defaultStore = await prisma.store.findFirst({
          where: { isActive: true },
          select: {
            name: true,
            city: true,
            province: true,
            address: true,
            postalCode: true,
            latitude: true,
            longitude: true,
          },
        })

        if (defaultStore) {
          storeName = defaultStore.name
          originLocation = {
            latitude: defaultStore.latitude,
            longitude: defaultStore.longitude,
            city: defaultStore.city,
            province: defaultStore.province,
            postalCode: defaultStore.postalCode,
            fullAddress: defaultStore.address,
          }
        } else {
          // Hard fallback Jakarta Pusat
          originLocation = {
            latitude: -6.1627,
            longitude: 106.8048,
            city: 'Jakarta Pusat',
            province: 'DKI Jakarta',
            postalCode: '10150',
          }
        }
      }
    }

    // 2. Resolve Customer Destination Location
    if (addressId) {
      const address = await prisma.userAddress.findUnique({
        where: { id: addressId },
        select: {
          id: true,
          recipientName: true,
          city: true,
          province: true,
          district: true,
          postalCode: true,
          fullAddress: true,
          latitude: true,
          longitude: true,
        },
      })

      if (address) {
        destLocation = {
          latitude: address.latitude,
          longitude: address.longitude,
          city: address.city,
          province: address.province,
          district: address.district,
          postalCode: address.postalCode,
          fullAddress: address.fullAddress,
        }
      }
    }

    if (!destLocation.city && directDestination) {
      destLocation = directDestination
    }

    // 3. Normalisasi items
    const parsedItems: ShippingItem[] =
      Array.isArray(items) && items.length > 0
        ? items.map((i: any) => ({
            name: i.name,
            weightGram: Number(i.weightGram) || 500,
            price: Number(i.price) || 0,
            quantity: Number(i.quantity) || 1,
          }))
        : [{ weightGram: Number(weightGram) || 500, quantity: 1 }]

    // 4. Kalkulasi opsi pengiriman
    const calculation = await calculateShippingOptions(
      originLocation,
      destLocation,
      parsedItems
    )

    return NextResponse.json({
      success: true,
      storeName,
      ...calculation,
    })
  } catch (error: any) {
    console.error('Error in /api/shipping/calculate:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal menghitung ongkos kirim real-time',
      },
      { status: 500 }
    )
  }
}
