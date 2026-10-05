import { buildSaleReceiptModel } from './saleReceipt';
import type { SaleDetailData } from '../hooks/useSaleDetail';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type BuildSaleReceiptHtmlInput = {
  sale: SaleDetailData;
  shopName: string;
  shopPhone?: string | null;
};

/** Compact thermal-friendly receipt HTML for system print. */
export function buildSaleReceiptHtml({
  sale,
  shopName,
  shopPhone,
}: BuildSaleReceiptHtmlInput): string {
  const receipt = buildSaleReceiptModel(sale, shopName, shopPhone);

  const rows = receipt.lines
    .map(
      item => `
      <tr>
        <td class="item">${escapeHtml(item.name)}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${escapeHtml(item.unitPrice)}</td>
        <td class="num">${escapeHtml(item.amount)}</td>
      </tr>`,
    )
    .join('');

  const balanceBlock = receipt.balanceOwed
    ? `
      <div class="section">
        <div class="muted upper">Balance</div>
        <div class="row">
          <span class="muted">Still owed</span>
          <span class="strong">${escapeHtml(receipt.balanceOwed)}</span>
        </div>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #111;
      font-size: 12px;
      line-height: 1.35;
    }
    .wrap { max-width: 360px; margin: 0 auto; }
    .center { text-align: center; }
    .shop {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .phone { margin-top: 4px; color: #666; font-size: 11px; }
    .badge {
      margin-top: 12px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #777;
    }
    .section {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px dashed #bbb;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 4px;
    }
    .muted { color: #777; }
    .strong { font-weight: 700; }
    .upper {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th {
      text-align: left;
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #777;
      padding: 6px 4px;
      border-bottom: 1px dashed #ccc;
    }
    th.num, td.num { text-align: right; white-space: nowrap; }
    td {
      padding: 8px 4px;
      vertical-align: top;
    }
    td.item {
      max-width: 140px;
      word-break: break-word;
      font-weight: 600;
    }
    .total-label { font-size: 14px; font-weight: 700; }
    .total-value {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .thanks {
      margin-top: 18px;
      font-size: 14px;
      font-weight: 700;
    }
    .powered {
      margin-top: 4px;
      font-size: 11px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="center">
      <div class="shop">${escapeHtml(receipt.shopName)}</div>
      ${
        receipt.shopPhone
          ? `<div class="phone">${escapeHtml(receipt.shopPhone)}</div>`
          : ''
      }
      <div class="badge">Sales receipt</div>
    </div>

    <div class="section">
      <div class="row"><span class="muted">Receipt</span><span class="strong">${escapeHtml(receipt.receiptNo)}</span></div>
      <div class="row"><span class="muted">Date</span><span>${escapeHtml(receipt.dateLabel)}</span></div>
      <div class="row"><span class="muted">Customer</span><span class="strong">${escapeHtml(receipt.customer)}</span></div>
      ${
        receipt.customerPhone
          ? `<div class="row"><span class="muted">Phone</span><span>${escapeHtml(receipt.customerPhone)}</span></div>`
          : ''
      }
      <div class="row"><span class="muted">Status</span><span>${escapeHtml(receipt.status)}</span></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="num">Qty</th>
          <th class="num">Price</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="section">
      <div class="row">
        <span class="total-label">Total</span>
        <span class="total-value">${escapeHtml(receipt.total)}</span>
      </div>
    </div>

    ${balanceBlock}

    <div class="section center">
      <div class="thanks">Thank you for your patronage</div>
      <div class="powered">Powered by StockBook</div>
    </div>
  </div>
</body>
</html>`;
}
