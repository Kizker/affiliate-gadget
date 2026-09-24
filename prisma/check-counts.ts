import prisma from '../src/lib/db';

async function main() {
  const models = [
    'User',
    'Store',
    'StoreBankAccount',
    'StoreSchedule',
    'Product',
    'ProductVariant',
    'Order',
    'OrderItem',
    'ReturnRequest',
    'Complaint',
    'Review',
    'LiveStream',
    'LiveStreamComment',
    'InternalAd',
    'UserAddress',
    'Voucher',
    'VoucherUsage',
    'AuditLog',
    'RentalItem',
    'RentalOrder',
    'Service',
    'ServiceOrder',
    'LcdEstimate'
  ];

  console.log('--- Current DB Count ---');
  for (const m of models) {
    try {
      // @ts-ignore
      const count = await prisma[m.charAt(0).toLowerCase() + m.slice(1)].count();
      console.log(`${m.padEnd(20)}: ${count}`);
    } catch (e: any) {
      console.log(`${m.padEnd(20)}: ERROR (${e.message})`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
