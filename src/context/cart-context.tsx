"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  id: string; // unique item key or productId
  productId: string;
  name: string;
  price: number;
  image?: string | null;
  categoryName?: string;
  quantity: number;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: { id: string; name: string; price: number; image?: string | null; categoryName?: string }, quantity?: number, notes?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  total: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  totalItems: 0,
  subtotal: 0,
  total: 0,
});

const CART_STORAGE_KEY = "ojolali_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // ignore JSON parse error
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, isLoaded]);

  const addItem = (
    product: { id: string; name: string; price: number; image?: string | null; categoryName?: string },
    quantity = 1,
    notes = ""
  ) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity, notes: notes || item.notes }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          categoryName: product.categoryName,
          quantity,
          notes,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal; // can add tax or packaging if needed

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        subtotal,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
