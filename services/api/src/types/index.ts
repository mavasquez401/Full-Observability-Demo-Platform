/**
 * Type definitions for the API service
 */

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: number;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_amount: number;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  created_at: Date;
}

export interface Job {
  id: number;
  order_id: number | null;
  job_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payload: any;
  result: any | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

export interface CheckoutRequest {
  user_id: string;
  items: {
    product_id: number;
    quantity: number;
  }[];
}

export interface FailureModeConfig {
  latency_ms?: number;
  error_rate?: number;
  db_stress?: boolean;
}

