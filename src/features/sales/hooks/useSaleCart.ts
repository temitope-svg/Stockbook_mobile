import { useMemo, useState } from 'react';
import type { Product } from '../../../types/domain';

export type SaleCartLine = {
  key: string;
  productId: string;
  quantity: number;
  unitPrice: number;
};

function newLineKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useSaleCart(products: Product[]) {
  const [lines, setLines] = useState<SaleCartLine[]>([]);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products) map.set(product.id, product);
    return map;
  }, [products]);

  function qtyInCart(productId: string, exceptKey?: string) {
    return lines
      .filter(line => line.productId === productId && line.key !== exceptKey)
      .reduce((sum, line) => sum + line.quantity, 0);
  }

  function remainingStock(productId: string, exceptKey?: string) {
    const product = productById.get(productId);
    return Math.max(0, (product?.quantity ?? 0) - qtyInCart(productId, exceptKey));
  }

  function addLine(productId: string, quantity: number, unitPrice: number) {
    const remaining = remainingStock(productId);
    if (quantity < 1) return { ok: false as const, reason: 'qty' as const };
    if (quantity > remaining) {
      return { ok: false as const, reason: 'stock' as const, remaining };
    }
    if (unitPrice < 0) return { ok: false as const, reason: 'price' as const };

    setLines(prev => {
      const existing = prev.find(line => line.productId === productId);
      if (existing) {
        return prev.map(line =>
          line.key === existing.key
            ? { ...line, quantity: line.quantity + quantity, unitPrice }
            : line,
        );
      }
      return [
        ...prev,
        { key: newLineKey(), productId, quantity, unitPrice },
      ];
    });
    return { ok: true as const };
  }

  function updateLine(
    key: string,
    patch: Partial<Pick<SaleCartLine, 'quantity' | 'unitPrice'>>,
  ) {
    const current = lines.find(line => line.key === key);
    if (!current) return { ok: false as const, reason: 'missing' as const };
    const nextQty = patch.quantity ?? current.quantity;
    const remaining = remainingStock(current.productId, key);
    if (nextQty < 1) return { ok: false as const, reason: 'qty' as const };
    if (nextQty > remaining) {
      return { ok: false as const, reason: 'stock' as const, remaining };
    }
    setLines(prev =>
      prev.map(line => (line.key === key ? { ...line, ...patch } : line)),
    );
    return { ok: true as const };
  }

  function removeLine(key: string) {
    setLines(prev => prev.filter(line => line.key !== key));
  }

  const total = lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  );

  return {
    lines,
    total,
    productById,
    remainingStock,
    addLine,
    updateLine,
    removeLine,
  };
}
