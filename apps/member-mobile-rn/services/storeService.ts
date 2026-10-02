import { api } from './api';

export const storeService = {
  async products(params?: { category?: string; search?: string; page?: number }) {
    const res = await api.get('/store/products', { params });
    return res.data;
  },
  async getProduct(slug: string) {
    const res = await api.get(`/store/products/${slug}`);
    return res.data;
  },
  async categories() {
    const res = await api.get('/store/categories');
    return res.data;
  },
  async addToCart(productId: string, quantity = 1) {
    const res = await api.post('/store/cart', { productId, quantity });
    return res.data;
  },
  async getCart() {
    const res = await api.get('/store/cart');
    return res.data;
  },
  async checkout(data: { addressId: string; paymentMethod: string }) {
    const res = await api.post('/store/checkout', data);
    return res.data;
  },
  async getOrders(page = 1) {
    const res = await api.get('/me/orders', { params: { page } });
    return res.data;
  },
};
