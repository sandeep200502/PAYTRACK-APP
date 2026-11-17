package com.paytrack.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A computed, read-only view of one invoice: money totals, how much has been
 * paid, what is still owed and the status (Draft / Unpaid / Partially Paid /
 * Overdue / Paid). Nothing here is stored in the database, it is calculated
 * every time from the invoice items and its payments.
 */
public record InvoiceSummary(
        String invoiceId,
        String number,
        String customerId,
        String customerName,
        LocalDate issueDate,
        LocalDate dueDate,
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal tax,
        BigDecimal total,
        BigDecimal paid,
        BigDecimal balance,
        String status,
        long daysOverdue) {
}
