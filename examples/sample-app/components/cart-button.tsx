"use client";

import { useCart } from "./cart-provider";
import { CartIcon } from "./icons";

export function CartButton() {
  const { itemCount, openCart } = useCart();

  return (
    <button className="cart-button" type="button" onClick={openCart}>
      <CartIcon />
      Trip kit
      <span aria-hidden="true">{itemCount}</span>
      <span className="sr-only">{itemCount} items</span>
    </button>
  );
}
