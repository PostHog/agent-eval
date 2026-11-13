"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cartSchema } from "@/lib/schemas";
import { readStoredValue } from "@/lib/storage";

export type CartLine = {
  productId: string;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  isOpen: boolean;
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    setLines(readStoredValue("northstar-cart", cartSchema, []));

    setReady(true);
  }, []);

  useEffect(() => {
    if (isReady) localStorage.setItem("northstar-cart", JSON.stringify(lines));
  }, [isReady, lines]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      itemCount: lines.reduce((total, line) => total + line.quantity, 0),
      isOpen,
      addItem: (productId) => {
        setLines((current) => {
          const existing = current.find((line) => line.productId === productId);

          if (!existing) return [...current, { productId, quantity: 1 }];

          return current.map((line) =>
            line.productId === productId
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          );
        });

        setOpen(true);
      },
      removeItem: (productId) => {
        setLines((current) =>
          current.filter((line) => line.productId !== productId),
        );
      },
      setQuantity: (productId, quantity) => {
        setLines((current) =>
          quantity < 1
            ? current.filter((line) => line.productId !== productId)
            : current.map((line) =>
                line.productId === productId ? { ...line, quantity } : line,
              ),
        );
      },
      clearCart: () => setLines([]),
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
    }),
    [isOpen, lines],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) throw new Error("useCart must be used inside CartProvider.");

  return context;
}
