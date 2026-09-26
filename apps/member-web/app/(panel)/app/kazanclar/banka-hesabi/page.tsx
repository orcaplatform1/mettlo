import { requireSession } from '@mettlo/web-core';
import { AddBankAccountForm } from './add-bank-form';

export default async function BankaHesabiPage() {
  await requireSession('/app/kazanclar/banka-hesabi');
  return (
    <div className="stack" style={{ ['--stack' as string]: '20px', maxWidth: 520 }}>
      <h1 className="h2">Banka Hesabı Ekle</h1>
      <div className="card" style={{ padding: '14px 16px', background: 'var(--color-warning-bg, #fef3c7)' }}>
        <p className="body-sm">
          <strong>Önemli:</strong> Yalnızca kendi adınıza kayıtlı banka hesabına ödeme yapılır.
          Başkasına ait IBAN girilmesi durumunda ödeme gerçekleştirilmez ve hesabınız askıya alınabilir.
        </p>
      </div>
      <AddBankAccountForm />
    </div>
  );
}
