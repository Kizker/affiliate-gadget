import ServiceTechnicianList from '@/components/service/service-technician-list'

export const metadata = {
    title: 'Jasa Servis - Affiliate Gadget',
    description: 'Layanan perbaikan gadget berkualitas dengan garansi oleh teknisi profesional.',
}

export default function JasaServisPage() {
    return <ServiceTechnicianList serviceType="jasa-servis" />
}
