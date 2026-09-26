'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Minus, X, Leaf, Wheat } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FoodItem {
  id: string;
  name: string;
  description?: string;
  priceKurus: number;
  imageUrl?: string;
  categoryId?: string;
  isVegan?: boolean;
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
  allergens?: string;
  status: string;
}

interface CartItem extends FoodItem { qty: number }

const fmtTL = (k: number) => `₺${(k / 100).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export function FoodMenuClient({ businessId, categories, items }: {
  businessId: string;
  categories: Array<{ id: string; name: string }>;
  items: FoodItem[];
}) {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ordered, setOrdered] = useState(false);
  const [note, setNote] = useState('');
  const router = useRouter();

  const availableItems = items.filter((it) => it.status === 'AVAILABLE');
  const filtered = activeCat ? availableItems.filter((it) => it.categoryId === activeCat) : availableItems;

  const cartTotal = cart.reduce((s, i) => s + i.priceKurus * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (item: FoodItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (!existing) return prev;
      if (existing.qty === 1) return prev.filter((i) => i.id !== itemId);
      return prev.map((i) => i.id === itemId ? { ...i, qty: i.qty - 1 } : i);
    });
  };

  const getQty = (itemId: string) => cart.find((i) => i.id === itemId)?.qty ?? 0;

  const placeOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/food-orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          businessId,
          items: cart.map((i) => ({ foodItemId: i.id, quantity: i.qty })),
          note: note.trim() || undefined,
        }),
      });
      if (res.status === 401) { router.push('/login?next=' + window.location.pathname); return; }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || 'Sipariş verilemedi.');
        return;
      }
      setOrdered(true);
      setCart([]);
      setShowCart(false);
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {ordered && (
        <div style={{ padding: '14px 20px', background: '#d1fae5', borderRadius: '10px', color: '#065f46', fontSize: '14px', fontWeight: 500, marginBottom: '20px' }}>
          Siparişiniz alındı! İşletme en kısa sürede hazırlayacak.
        </div>
      )}

      {/* Kategori filtreleri */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveCat(null)}
            style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '12px', border: 'none', cursor: 'pointer', background: !activeCat ? 'var(--accent)' : 'var(--surface-2)', color: !activeCat ? '#fff' : 'inherit' }}
          >
            Tümü
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id === activeCat ? null : cat.id)}
              style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '12px', border: 'none', cursor: 'pointer', background: activeCat === cat.id ? 'var(--accent)' : 'var(--surface-2)', color: activeCat === cat.id ? '#fff' : 'inherit' }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Ürün listesi */}
      {filtered.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>Bu kategoride ürün bulunmuyor.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((item) => {
            const qty = getQty(item.id);
            return (
              <div key={item.id} style={{ background: 'var(--surface-2)', borderRadius: '12px', padding: '14px', border: '1px solid var(--border)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} style={{ width: '72px', height: '72px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.name}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                        {item.isVegan && <span style={{ fontSize: '10px', background: '#d1fae5', color: '#065f46', padding: '1px 6px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}><Leaf size={9} />Vegan</span>}
                        {item.isVegetarian && !item.isVegan && <span style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '8px' }}>Vejetaryen</span>}
                        {item.isGlutenFree && <span style={{ fontSize: '10px', background: '#ede9fe', color: '#5b21b6', padding: '1px 6px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}><Wheat size={9} />Glutensiz</span>}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtTL(item.priceKurus)}</div>
                  </div>
                  {item.description && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>{item.description}</p>}
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {qty > 0 ? (
                      <>
                        <button onClick={() => removeFromCart(item.id)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '14px', fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                        <button onClick={() => addToCart(item)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={12} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => addToCart(item)} style={{ padding: '5px 14px', borderRadius: '8px', background: 'var(--accent)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '12px', fontWeight: 500 }}>
                        Ekle
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sepet butonu (sticky) */}
      {cartCount > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '40px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 50 }}
        >
          <ShoppingCart size={16} />
          {cartCount} ürün — {fmtTL(cartTotal)}
        </button>
      )}

      {/* Sepet modalı */}
      {showCart && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowCart(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--background)', borderRadius: '20px 20px 0 0', padding: '24px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Sepetim</h2>
              <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
            </div>

            {cart.map((ci) => (
              <div key={ci.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>{ci.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ci.qty} × {fmtTL(ci.priceKurus)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600 }}>{fmtTL(ci.priceKurus * ci.qty)}</span>
                  <button onClick={() => setCart((p) => p.filter((i) => i.id !== ci.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><X size={14} /></button>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>Not (isteğe bağlı)</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '13px', fontFamily: 'inherit', resize: 'none' }} placeholder="Özel istek veya not…" />
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px' }}>
              <span>Toplam</span>
              <span>{fmtTL(cartTotal)}</span>
            </div>

            {error && <p style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '8px' }}>{error}</p>}

            <button
              onClick={placeOrder}
              disabled={loading}
              style={{ marginTop: '16px', width: '100%', padding: '14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
            >
              {loading ? 'İşleniyor…' : 'Sipariş Ver'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
