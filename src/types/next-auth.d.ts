import 'next-auth'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      image: string | null
      role: UserRole
      storeId?: string | null
      isTechnician?: boolean
      mitraStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null
    }
  }

  interface User {
    role: UserRole
    storeId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    storeId?: string | null
  }
}
