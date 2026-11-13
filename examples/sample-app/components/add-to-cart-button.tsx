"use client";

import { useCart } from "./cart-provider";

type AddToCartButtonProps = {
  productId: string;
  disabled?: boolean;
  className?: string;
};

export function AddToCartButton({
  productId,
  disabled,
  className,
}: AddToCartButtonProps) {
  const { addItem } = useCart();

  return (
    <button
      className={className}
      type="button"
      disabled={disabled}
      onClick={() => addItem(productId)}
    >
      {disabled ? "Out of stock" : "Add to trip kit"}
    </button>
  );
}
