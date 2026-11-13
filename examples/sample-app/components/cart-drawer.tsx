"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { formatPrice } from "@/lib/format";
import { products } from "@/lib/products";
import styles from "./cart-drawer.module.css";
import { useCart } from "./cart-provider";
import { CloseIcon } from "./icons";

export function CartDrawer() {
  const dialog = useRef<HTMLDialogElement>(null);
  const { lines, isOpen, closeCart, removeItem, setQuantity } = useCart();

  const items = lines.flatMap((line) => {
    const product = products.find((entry) => entry.id === line.productId);

    return product ? [{ ...line, product }] : [];
  });

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  useEffect(() => {
    if (isOpen && !dialog.current?.open) dialog.current?.showModal();

    if (!isOpen && dialog.current?.open) dialog.current.close();
  }, [isOpen]);

  return (
    <dialog ref={dialog} className={styles.dialog} onClose={closeCart}>
      <div className={styles.header}>
        <div>
          <p className="supporting-text">Ready for the trail</p>
          <h2>Your trip kit</h2>
        </div>
        <button className="icon-button" type="button" onClick={closeCart}>
          <CloseIcon />
          <span className="sr-only">Close trip kit</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <h3>Your kit is empty.</h3>
          <p>Add a few dependable things before you head out.</p>
          <Link className="text-link" href="/shop" onClick={closeCart}>
            Browse all gear
          </Link>
        </div>
      ) : (
        <>
          <ul className={styles.items}>
            {items.map(({ product, quantity }) => (
              <li key={product.id} className={styles.item}>
                <Image
                  src={product.image}
                  alt=""
                  width={96}
                  height={112}
                  sizes="96px"
                />
                <div>
                  <h3>{product.name}</h3>
                  <p>{formatPrice(product.price)}</p>
                  <label>
                    Quantity
                    <input
                      type="number"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(product.id, Number(event.target.value))
                      }
                    />
                  </label>
                  <button
                    className="quiet-button"
                    type="button"
                    onClick={() => removeItem(product.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className={styles.total}>
            <span>Estimated total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <Link className="primary-button" href="/checkout" onClick={closeCart}>
            Check out
          </Link>
        </>
      )}
    </dialog>
  );
}
