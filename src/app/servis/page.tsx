import { Metadata } from 'next'
import { Navbar, Footer, MobileBottomNav } from '@/components/layouts'
import { IntegratedServiceView } from '@/components/service/integrated-service-view'

export const metadata: Metadata = {
  title: 'Layanan Servis Gadget Terintegrasi | Affiliate Gadget',
  description:
    'Pusat layanan servis gadget profesional & terpercaya di Indonesia. Meja pengerjaan open lab transparan, teknisi level-3 specialist standby, dan garansi resmi nota digital.',
}

export default function ServisPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar variant="light" />
      <main className="flex-1">
        <IntegratedServiceView />
      </main>
      <Footer />
      <MobileBottomNav activeTab="servis" />
    </div>
  )
}
