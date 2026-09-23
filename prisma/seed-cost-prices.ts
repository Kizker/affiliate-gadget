// Script Seed Harga Modal (HPP / Cost Price) Produk & OrderItem
import db from '../src/lib/db'

interface CostPriceMapping {
  namePattern: RegExp
  baseCostPrice: number
  variantMap?: Record<string, number>
}

const COST_PRICE_RULES: CostPriceMapping[] = [
  {
    namePattern: /iPhone 15 Pro Max/i,
    baseCostPrice: 20200000,
    variantMap: {
      '256GB - Natural Titanium': 20200000,
      '256GB - Blue Titanium': 20200000,
      '512GB - Black Titanium': 23800000,
      '1TB - White Titanium': 27200000,
    },
  },
  {
    namePattern: /iPhone 15 Pro/i,
    baseCostPrice: 17000000,
    variantMap: {
      '128GB - Natural Titanium': 17000000,
      '256GB - Black Titanium': 19000000,
    },
  },
  {
    namePattern: /iPhone 14/i,
    baseCostPrice: 10900000,
    variantMap: {
      '128GB - Midnight': 10900000,
      '128GB - Starlight': 10900000,
      '256GB - Blue': 13100000,
    },
  },
  {
    namePattern: /Galaxy S24 Ultra/i,
    baseCostPrice: 19500000,
    variantMap: {
      '12GB / 256GB - Titanium Gray': 19500000,
      '12GB / 512GB - Titanium Black': 21200000,
      '12GB / 512GB - Titanium Violet': 21200000,
    },
  },
  {
    namePattern: /Galaxy Z Fold 6/i,
    baseCostPrice: 23500000,
    variantMap: {
      '12GB / 256GB - Silver Shadow': 23500000,
      '12GB / 512GB - Navy': 25200000,
    },
  },
  {
    namePattern: /Galaxy A55/i,
    baseCostPrice: 5200000,
    variantMap: {
      '8GB / 256GB - Awesome Iceblue': 5200000,
      '8GB / 256GB - Awesome Navy': 5200000,
    },
  },
  {
    namePattern: /Samsung S25/i,
    baseCostPrice: 16200000,
    variantMap: {
      '512GB - Natural Titanium': 16200000,
    },
  },
  {
    namePattern: /Xiaomi 14/i,
    baseCostPrice: 10500000,
    variantMap: {
      '12GB / 256GB - Black': 10500000,
      '12GB / 512GB - Jade Green': 11400000,
      '12GB / 512GB - White': 11400000,
    },
  },
  {
    namePattern: /POCO F6 Pro/i,
    baseCostPrice: 7400000,
    variantMap: {
      '12GB / 512GB - Black': 7400000,
      '16GB / 1TB - White': 8250000,
    },
  },
  {
    namePattern: /ROG Phone 8 Pro/i,
    baseCostPrice: 13600000,
    variantMap: {
      '16GB / 512GB - Phantom Black': 13600000,
      '24GB / 1TB - Phantom Edition': 17500000,
    },
  },
  {
    namePattern: /Vivo X100 Pro/i,
    baseCostPrice: 14900000,
    variantMap: {
      '16GB / 512GB - Asteroid Black': 14900000,
      '16GB / 512GB - Sunset Orange': 14900000,
    },
  },
  {
    namePattern: /Vivo V30 Pro/i,
    baseCostPrice: 7850000,
    variantMap: {
      '12GB / 512GB - Equatorial Green': 7850000,
      '12GB / 512GB - Volcanic Black': 7850000,
    },
  },
  {
    namePattern: /Find N3 Flip/i,
    baseCostPrice: 13100000,
    variantMap: {
      '12GB / 256GB - Cream Gold': 13100000,
      '12GB / 256GB - Sleek Black': 13100000,
    },
  },
]

export async function seedCostPrices() {
  console.log('🚀 Memulai seeding harga modal (HPP / costPrice)...')

  const products = await db.product.findMany({
    include: {
      variants: true,
    },
  })

  let updatedProductsCount = 0
  let updatedVariantsCount = 0

  for (const product of products) {
    const matchedRule = COST_PRICE_RULES.find((rule) =>
      rule.namePattern.test(product.name)
    )

    const baseCostPrice = matchedRule
      ? matchedRule.baseCostPrice
      : Math.round((product.price * 0.88) / 10000) * 10000

    await db.product.update({
      where: { id: product.id },
      data: { costPrice: baseCostPrice },
    })
    updatedProductsCount++

    for (const variant of product.variants) {
      let variantCostPrice = baseCostPrice
      if (matchedRule?.variantMap && matchedRule.variantMap[variant.name]) {
        variantCostPrice = matchedRule.variantMap[variant.name]
      } else if (variant.price) {
        variantCostPrice = Math.round((variant.price * 0.88) / 10000) * 10000
      }

      await db.productVariant.update({
        where: { id: variant.id },
        data: { costPrice: variantCostPrice },
      })
      updatedVariantsCount++
    }
  }

  console.log(
    `✅ Berhasil memperbarui ${updatedProductsCount} produk dan ${updatedVariantsCount} varian.`
  )

  // Sinkronisasi OrderItem yang belum memiliki costPrice (> 0)
  console.log('📦 Memperbarui snapshot costPrice pada OrderItem existing...')
  const orderItems = await db.orderItem.findMany({
    where: {
      costPrice: 0,
      productId: { not: null },
    },
    include: {
      product: true,
    },
  })

  let updatedOrderItemsCount = 0
  for (const item of orderItems) {
    if (item.productId && item.product) {
      let itemCost = item.product.costPrice
      if (item.variantId) {
        const variant = await db.productVariant.findUnique({
          where: { id: item.variantId },
        })
        if (variant?.costPrice) {
          itemCost = variant.costPrice
        }
      }
      if (itemCost > 0) {
        await db.orderItem.update({
          where: { id: item.id },
          data: { costPrice: itemCost },
        })
        updatedOrderItemsCount++
      }
    }
  }

  console.log(
    `✅ Berhasil memperbarui ${updatedOrderItemsCount} OrderItem existing dengan costPrice snapshot.`
  )

  // Fallback untuk OrderItem tanpa productId atau masih costPrice = 0
  const orphanItems = await db.orderItem.findMany({
    where: { costPrice: 0, price: { gt: 0 } },
  })
  for (const item of orphanItems) {
    const estimatedCost = Math.round((item.price * 0.88) / 10000) * 10000
    await db.orderItem.update({
      where: { id: item.id },
      data: { costPrice: estimatedCost },
    })
    console.log(
      `  -> Fallback costPrice Rp ${estimatedCost} untuk OrderItem ${item.id} (harga Rp ${item.price})`
    )
  }

  // Memastikan semua store memiliki defaultPackingFee = 5000
  const storeUpdateResult = await db.store.updateMany({
    where: {
      defaultPackingFee: { not: 5000 },
    },
    data: {
      defaultPackingFee: 5000,
    },
  })
  console.log(
    `✅ ${storeUpdateResult.count} toko dipastikan memiliki defaultPackingFee Rp 5.000.`
  )

  return {
    updatedProductsCount,
    updatedVariantsCount,
    updatedOrderItemsCount,
  }
}

if (process.argv[1]?.includes('seed-cost-prices')) {
  seedCostPrices()
    .catch((err) => {
      console.error('❌ Error seeding cost prices:', err)
      process.exit(1)
    })
    .finally(async () => {
      await db.$disconnect()
      process.exit(0)
    })
}
