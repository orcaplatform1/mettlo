import { requireSession } from '@mettlo/web-core';
import { AddBankAccountForm } from './add-bank-form';

export default async function BankaHesabiPage() {
  await requireSession('/app/earnings/bank-account');
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px', maxWidth: 520 }}>
      <h1 className="h2">Banka Hesabı Ekle</h1>
      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,.15)', border: '1px solid rgba(245,158,11,.4)', color: 'var(--color-text-primary)' }}>
        <p className="body-sm"><strong style={{ color: '#d97706' }}>⚠ Önemli:</strong> Yalnızca kendi adınıza kayıtlı banka hesabına ödeme yapılır. Başkasına ait IBAN girilmesi durumunda ödeme gerçekleştirilmez ve hesabınız askıya alınabilir.</p>
      </div>
      <AddBankAccountForm />
    </div>
  );
}
