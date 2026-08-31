import ServiceTechnicianList from '@/components/service/service-technician-list'

export const metadata = {
    title: 'Jasa Cek/Bongkar - Affiliate Gadget',
    description: 'Layanan diagnosa lengkap kondisi gadget oleh teknisi profesional.',
}

export default function CekBongkarPage() {
    return <ServiceTechnicianList serviceType="cek-bongkar" />
}
