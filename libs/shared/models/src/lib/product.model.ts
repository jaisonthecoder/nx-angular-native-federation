/**
 * Product Model
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: Currency;
  category: ProductCategory;
  images: string[];
  stock: number;
  sku: string;
  isAvailable: boolean;
  rating: ProductRating;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CNY = 'CNY',
  INR = 'INR'
}

export enum ProductCategory {
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing',
  BOOKS = 'books',
  HOME = 'home',
  SPORTS = 'sports',
  TOYS = 'toys',
  FOOD = 'food',
  OTHER = 'other'
}

export interface ProductRating {
  average: number;
  count: number;
  reviews: Review[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

// DTOs
export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  currency: Currency;
  category: ProductCategory;
  stock: number;
  sku: string;
  tags?: string[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  isAvailable?: boolean;
  tags?: string[];
}

