import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * API base URL
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
