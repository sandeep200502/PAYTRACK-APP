package com.paytrack.dto;

import com.paytrack.model.Customer;
import com.paytrack.model.Payment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Account statement for one customer: what was billed, what was paid, what is left. */
public record CustomerStatement(
        Customer customer,
        LocalDate asOf,
        List<InvoiceSummary> invoices,
        List<Payment> payments,
        BigDecimal totalBilled,
        BigDecimal totalPaid,
        BigDecimal outstanding) {
}
