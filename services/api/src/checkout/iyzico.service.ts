import { Injectable, Logger } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';
import { env } from '../common/env';

export interface IyzicoCheckoutFormInit {
  locale?: string;
  conversationId: string;
  price: string;
  paidPrice: string;
  currency?: string;
  basketId: string;
  paymentGroup?: string;
  callbackUrl: string;
  enabledInstallments?: number[];
  buyer: {
    id: string;
    name: string;
    surname: string;
    gsmNumber: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
  };
  shippingAddress: { contactName: string; city: string; country: string; address: string };
  billingAddress: { contactName: string; city: string; country: string; address: string };
  basketItems: Array<{ id: string; name: string; category1: string; itemType: string; price: string }>;
}

export interface IyzicoCheckoutFormResult {
  status: string;
  errorCode?: string;
  errorMessage?: string;
  token?: string;
  checkoutFormContent?: string;
  conversationId?: string;
}

export interface IyzicoPaymentDetail {
  status: string;
  errorCode?: string;
  errorMessage?: string;
  paymentStatus?: string;
  paymentId?: string;
  price?: string;
  paidPrice?: string;
  currency?: string;
  conversationId?: string;
  basketId?: string;
}

@Injectable()
export class IyzicoService {
  private readonly log = new Logger('Iyzico');

  private get apiKey() { return env.IYZICO_API_KEY ?? ''; }
  private get secretKey() { return env.IYZICO_SECRET_KEY ?? ''; }
  private get baseUrl() { return env.IYZICO_BASE_URL; }

  private toPki(obj: Record<string, any>): string {
    const parts: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      if (val === null || val === undefined) continue;
      if (Array.isArray(val)) {
        const items = val.map((item: any) => (typeof item === 'object' && item !== null) ? '[' + this.toPki(item) + ']' : String(item));
        parts.push(`${key}=[${items.join(',')}]`);
      } else if (typeof val === 'object') {
        parts.push(`${key}=[${this.toPki(val)}]`);
      } else {
        parts.push(`${key}=${val}`);
      }
    }
    return parts.join(',');
  }

  private authHeader(body: Record<string, any>): string {
    const nonce = randomBytes(8).toString('hex');
    const pki = '[' + this.toPki(body) + ']';
    const hash = createHmac('sha256', this.secretKey)
      .update(this.apiKey + nonce + pki)
      .digest('base64');
    const param = `${this.apiKey}:${nonce}:${hash}`;
    return 'IYZWSv2 ' + Buffer.from(param).toString('base64');
  }

  private async post<T>(path: string, body: Record<string, any>): Promise<T> {
    const url = this.baseUrl + path;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.authHeader(body),
      },
      body: JSON.stringify(body),
    });
    return res.json() as Promise<T>;
  }

  async initCheckoutForm(params: IyzicoCheckoutFormInit): Promise<IyzicoCheckoutFormResult> {
    if (!this.apiKey || !this.secretKey) {
      this.log.warn('iyzico anahtarları yapılandırılmamış — ödeme devre dışı');
      return { status: 'failure', errorCode: 'UNCONFIGURED', errorMessage: 'Ödeme altyapısı henüz yapılandırılmamış.' };
    }
    try {
      return this.post<IyzicoCheckoutFormResult>('/payment/checkoutform/initialize', {
        locale: 'tr', currency: 'TRY', paymentGroup: 'SUBSCRIPTION', enabledInstallments: [1, 2, 3, 6, 9, 12], ...params,
      });
    } catch (err) {
      this.log.error('iyzico initCheckoutForm hata:', err);
      return { status: 'failure', errorCode: 'NETWORK', errorMessage: 'Ödeme servisi ile iletişim kurulamadı.' };
    }
  }

  async retrieveCheckoutForm(conversationId: string, token: string): Promise<IyzicoPaymentDetail> {
    if (!this.apiKey || !this.secretKey) return { status: 'failure', errorCode: 'UNCONFIGURED' };
    try {
      return this.post<IyzicoPaymentDetail>('/payment/checkoutform/auth', { locale: 'tr', conversationId, token });
    } catch (err) {
      this.log.error('iyzico retrieveCheckoutForm hata:', err);
      return { status: 'failure', errorCode: 'NETWORK' };
    }
  }
}
