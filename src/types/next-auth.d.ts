import 'next-auth'
import '@auth/core/types'
import { UserRole, MitraStatus } from '@prisma/client'

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
      mitraStatus?: MitraStatus | null
    }
  }

  interface User {
    role?: UserRole
    storeId?: string | null
    isTechnician?: boolean
    mitraStatus?: MitraStatus | null
  }
}

declare module '@auth/core/types' {
  interface User {
    role?: UserRole
    storeId?: string | null
    isTechnician?: boolean
    mitraStatus?: MitraStatus | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    storeId?: string | null
  }
}
