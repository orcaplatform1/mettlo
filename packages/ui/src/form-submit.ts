import { startTransition, type FormEvent } from 'react';

/**
 * React 19, `<form action={fn}>` tamamlanınca formu SIFIRLAR: hata durumunda kullanıcının yazdıkları (ve 2FA adımında şifre) silinir.
 * Bu yardımcı aynı server action'ı onSubmit ile çağırır; form sıfırlanmaz, hata mesajı yanında girdiler korunur.
 * Başarıda temizlemek isteyen formlar kendi `ref.current.reset()` çağrısını yapar.
 */
export function noResetSubmit(action: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
}
