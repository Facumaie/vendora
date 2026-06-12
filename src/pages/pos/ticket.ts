import jsPDF from 'jspdf';
import { money } from '../../lib/utils';
import type { CartLine } from '../../stores/cartStore';

export function ticketPdf(
  number: number,
  lines: CartLine[],
  totals: { subtotal: number; discountTotal: number; total: number },
  payment: string,
) {
  const docH = 120 + lines.length * 6;
  const doc = new jsPDF({ unit: 'mm', format: [80, Math.max(docH, 140)] });
  let y = 10;
  const c = (txt: string, size = 9, bold = false) => {
    doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(txt, 40, y, { align: 'center' }); y += size * 0.5 + 1.5;
  };
  c('VENDORA', 14, true);
  c(`Ticket #${number}`, 10, true);
  c(new Date().toLocaleString('es-AR'), 8);
  y += 2; doc.line(5, y, 75, y); y += 5;

  doc.setFontSize(8);
  for (const l of lines) {
    const lineTotal = l.product.salePrice * l.qty * (1 - l.discount / 100);
    doc.text(`${l.qty} × ${l.product.name.slice(0, 28)}`, 5, y);
    doc.text(money(lineTotal), 75, y, { align: 'right' });
    y += 5;
  }
  y += 1; doc.line(5, y, 75, y); y += 5;
  doc.text(`Subtotal: ${money(totals.subtotal)}`, 75, y, { align: 'right' }); y += 5;
  doc.text(`Descuentos: -${money(totals.discountTotal)}`, 75, y, { align: 'right' }); y += 6;
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: ${money(totals.total)}`, 75, y, { align: 'right' }); y += 7;
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(`Pago: ${payment}`, 5, y); y += 8;
  doc.setFontSize(8); doc.text('¡Gracias por su compra!', 40, y, { align: 'center' });
  doc.save(`ticket-${number}.pdf`);
}
