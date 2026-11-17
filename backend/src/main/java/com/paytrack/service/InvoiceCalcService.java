package com.paytrack.service;

import com.paytrack.model.Invoice;
import com.paytrack.model.InvoiceItem;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Java port of the frontend's src/utils/invoiceCalc.js totals math.
 * Kept identical on purpose: subtotal -> discount -> GST on the discounted
 * value -> grand total, all rounded to 2 decimals at each step. This is what
 * guards the server-side "a payment can never exceed the remaining balance"
 * rule (the one piece of business logic the original Express server also
 * duplicated server-side).
 */
@Service
public class InvoiceCalcService {

    public record Totals(BigDecimal subtotal, BigDecimal discount, BigDecimal taxable, BigDecimal tax, BigDecimal total) {
    }

    private static BigDecimal round2(BigDecimal n) {
        return (n == null ? BigDecimal.ZERO : n).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal lineAmount(InvoiceItem item) {
        BigDecimal qty = item.getQuantity() == null ? BigDecimal.ZERO : BigDecimal.valueOf(item.getQuantity());
        BigDecimal price = item.getUnitPrice() == null ? BigDecimal.ZERO : item.getUnitPrice();
        return round2(qty.multiply(price));
    }

    public Totals calcTotals(Invoice invoice) {
        BigDecimal subtotal = round2(invoice.getItems().stream()
                .map(this::lineAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        BigDecimal discountValue = invoice.getDiscountValue() == null ? BigDecimal.ZERO : invoice.getDiscountValue();
        BigDecimal rawDiscount = "percent".equals(invoice.getDiscountType())
                ? subtotal.multiply(discountValue).divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)
                : discountValue;
        BigDecimal discount = round2(rawDiscount.max(BigDecimal.ZERO).min(subtotal));

        BigDecimal taxable = round2(subtotal.subtract(discount));
        BigDecimal taxRate = invoice.getTaxRate() == null ? BigDecimal.ZERO : invoice.getTaxRate();
        BigDecimal tax = round2(taxable.multiply(taxRate).divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP));
        BigDecimal total = round2(taxable.add(tax));

        return new Totals(subtotal, discount, taxable, tax, total);
    }
}
