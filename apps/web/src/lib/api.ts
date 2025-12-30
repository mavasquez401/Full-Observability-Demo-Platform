import { API_URL } from './utils';
import { Product, Order, CheckoutRequest } from '@/types';

/**
 * API client functions
 */

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_URL}/products`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  const data = await response.json();
  return data.products;
}

export async function fetchProduct(id: number): Promise<Product> {
  const response = await fetch(`${API_URL}/products/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  return response.json();
}

export async function checkout(request: CheckoutRequest): Promise<Order> {
  const response = await fetch(`${API_URL}/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to checkout');
  }
  const data = await response.json();
  return data.order;
}

export async function fetchOrders(userId: string = 'demo-user'): Promise<Order[]> {
  const response = await fetch(`${API_URL}/orders?user_id=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  const data = await response.json();
  return data.orders;
}
