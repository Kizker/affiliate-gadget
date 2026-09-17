declare module 'midtrans-client' {
  export interface MidtransConfig {
    isProduction?: boolean
    serverKey: string
    clientKey: string
  }

  export interface SnapTransactionParameters {
    transaction_details: {
      order_id: string
      gross_amount: number
    }
    item_details?: Array<{
      id: string
      price: number
      quantity: number
      name: string
      brand?: string
      category?: string
    }>
    customer_details?: {
      first_name?: string
      last_name?: string
      email?: string
      phone?: string
      billing_address?: {
        first_name?: string
        phone?: string
        address?: string
        city?: string
        postal_code?: string
      }
      shipping_address?: {
        first_name?: string
        phone?: string
        address?: string
        city?: string
        postal_code?: string
      }
    }
    callbacks?: {
      finish?: string
    }
  }

  export interface SnapTransactionResponse {
    token: string
    redirect_url: string
  }

  export class Snap {
    constructor(config: MidtransConfig)
    createTransaction(
      parameter: SnapTransactionParameters
    ): Promise<SnapTransactionResponse>
    createTransactionToken(
      parameter: SnapTransactionParameters
    ): Promise<string>
    createTransactionRedirectUrl(
      parameter: SnapTransactionParameters
    ): Promise<string>
  }

  export class CoreApi {
    constructor(config: MidtransConfig)
    charge(parameter: any): Promise<any>
    capture(parameter: any): Promise<any>
    transaction: {
      status(transactionIdOrOrderId: string): Promise<any>
      approve(transactionId: string): Promise<any>
      cancel(transactionId: string): Promise<any>
      expire(transactionId: string): Promise<any>
      refund(transactionId: string, parameter: any): Promise<any>
    }
  }

  const midtransClient: {
    Snap: typeof Snap
    CoreApi: typeof CoreApi
  }
  export default midtransClient
}

interface Window {
  snap?: {
    pay: (
      token: string,
      options?: {
        onSuccess?: (result: any) => void
        onPending?: (result: any) => void
        onError?: (result: any) => void
        onClose?: () => void
      }
    ) => void
  }
}
