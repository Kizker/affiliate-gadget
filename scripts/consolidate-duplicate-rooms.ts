import 'dotenv/config'
import prisma from '../src/lib/db'

async function consolidateDuplicateRooms() {
  console.log(
    '🔄 Memulai pemindaian dan konsolidasi room duplikat di database...'
  )

  // 1. Ambil seluruh room yang ada
  const allRooms = await prisma.adminChatRoom.findMany({
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      customer: { select: { id: true, name: true, email: true } },
      store: { select: { id: true, name: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
  })

  console.log(`Ditemukan total ${allRooms.length} room di database.`)

  // Kelompokkan berdasarkan key: customerId + "_" + (storeId || 'CS')
  const groups: Record<string, typeof allRooms> = {}

  for (const r of allRooms) {
    const key = `${r.customerId}_${r.storeId || 'CS'}`
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(r)
  }

  let mergedCount = 0

  for (const [key, rooms] of Object.entries(groups)) {
    if (rooms.length <= 1) continue

    console.log(
      `\n⚠️ Terdeteksi duplikat untuk key: ${key} (${rooms.length} rooms)`
    )
    console.log(
      `   Customer: ${rooms[0].customer?.name} (${rooms[0].customer?.email})`
    )
    console.log(`   Toko: ${rooms[0].store?.name || 'Customer Service'}`)

    // Urutkan: room dengan pesan terbanyak atau riwayat terlama/paling stabil sebagai primary
    // Jika salah satunya punya riwayat pesan lama, kita jadikan primary
    rooms.sort((a, b) => {
      // Prioritaskan yang punya pesan lebih banyak
      if (b.messages.length !== a.messages.length) {
        return b.messages.length - a.messages.length
      }
      // Atau yang createdAt lebih awal (riwayat room asli)
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

    const primaryRoom = rooms[0]
    const duplicateRooms = rooms.slice(1)

    console.log(
      `   ⭐ Primary Room ID: ${primaryRoom.id} (Pesan: ${primaryRoom.messages.length})`
    )

    // Kumpulkan orderId terbaru dari duplicate rooms jika primary tidak punya atau duplicate lebih baru
    let latestOrderId = primaryRoom.orderId
    let latestClaimedById = primaryRoom.claimedById
    let latestLastMessageAt = primaryRoom.lastMessageAt || primaryRoom.createdAt

    for (const dup of duplicateRooms) {
      console.log(
        `   ❌ Duplicate Room ID: ${dup.id} (Pesan: ${dup.messages.length}) -> Akan di-merge`
      )
      if (dup.orderId) {
        latestOrderId = dup.orderId
      }
      if (dup.claimedById) {
        latestClaimedById = dup.claimedById
      }
      if (
        dup.lastMessageAt &&
        (!latestLastMessageAt || dup.lastMessageAt > latestLastMessageAt)
      ) {
        latestLastMessageAt = dup.lastMessageAt
      }

      // Pindahkan seluruh pesan dari dup room ke primary room
      if (dup.messages.length > 0) {
        await prisma.adminChatMessage.updateMany({
          where: { roomId: dup.id },
          data: { roomId: primaryRoom.id },
        })
        console.log(
          `      -> ${dup.messages.length} pesan dipindahkan ke ${primaryRoom.id}`
        )
      }

      // Hapus duplicate room
      await prisma.adminChatRoom.delete({
        where: { id: dup.id },
      })
      console.log(`      -> Duplicate room ${dup.id} berhasil dihapus.`)
      mergedCount++
    }

    // Update primary room dengan order context terbaru dan lastMessageAt
    await prisma.adminChatRoom.update({
      where: { id: primaryRoom.id },
      data: {
        orderId: latestOrderId,
        claimedById: latestClaimedById,
        lastMessageAt: latestLastMessageAt,
      },
    })
    console.log(
      `   ✅ Primary Room ${primaryRoom.id} berhasil diperbarui (orderId: ${latestOrderId}).`
    )
  }

  console.log(
    `\n🎉 Konsolidasi selesai! Total ${mergedCount} room duplikat telah digabung dan dibersihkan.`
  )
}

consolidateDuplicateRooms()
  .catch((err) => {
    console.error('Error saat konsolidasi room:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
