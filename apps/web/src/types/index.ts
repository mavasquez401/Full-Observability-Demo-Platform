/**
 * Type definitions for the web application
 */

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  user_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  total_amount: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CheckoutRequest {
  user_id: string;
  items: {
    product_id: number;
    quantity: number;
  }[];
}
