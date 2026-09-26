/** Provider abstraction: gerçek iyzico/PayTR entegrasyonu bu interface üzerinden bağlanır. */

export interface PayoutProviderRequest {
  idempotencyKey: string;
  amountKurus: number;
  currency: string;
  recipientName: string;
  ibanDecrypted: string;
  description?: string;
}

export interface PayoutProviderResponse {
  providerPayoutId: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  rawResponse: unknown;
  failureReason?: string;
}

export abstract class PayoutProvider {
  abstract sendPayout(req: PayoutProviderRequest): Promise<PayoutProviderResponse>;
  abstract getPayoutStatus(providerPayoutId: string): Promise<PayoutProviderResponse>;
  abstract verifyWebhookSignature(payload: string, signature: string): boolean;
}

/** Gerçek sağlayıcı hazır olana kadar stub implementasyon. Üretim ortamında değiştir. */
export class MockPayoutProvider extends PayoutProvider {
  sendPayout(_req: PayoutProviderRequest): Promise<PayoutProviderResponse> {
    // Gerçek API credentials olmadan çağrı yapmaz
    return Promise.resolve({
      providerPayoutId: `mock_${Date.now()}`,
      status: 'processing',
      rawResponse: { note: 'Mock — gerçek iyzico entegrasyonu bağlanmadı' },
    });
  }
  getPayoutStatus(_providerPayoutId: string): Promise<PayoutProviderResponse> {
    return Promise.resolve({
      providerPayoutId: _providerPayoutId,
      status: 'processing',
      rawResponse: { note: 'Mock' },
    });
  }
  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    return false; // Üretimde imza doğrulaması zorunlu
  }
}
