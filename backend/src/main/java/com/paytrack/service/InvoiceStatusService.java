package com.paytrack.service;

import com.paytrack.dto.InvoiceSummary;
import com.paytrack.model.Invoice;
import com.paytrack.model.Payment;
import com.paytrack.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Works out the status of an invoice. The status is never stored, it is
 * derived from the totals, the payments received and today's date, so it can
 * never go out of date.
 */
@Service
public class InvoiceStatusService {

    public static final String DRAFT = "Draft";
    public static final String UNPAID = "Unpaid";
    public static final String PARTIAL = "Partially Paid";
    public static final String OVERDUE = "Overdue";
    public static final String PAID = "Paid";

    /** All valid status names, in the order the dashboard shows them. */
    public static final List<String> ALL_STATUSES = List.of(DRAFT, UNPAID, PARTIAL, OVERDUE, PAID);

    private final InvoiceCalcService calcService;
    private final PaymentRepository paymentRepository;

    public InvoiceStatusService(InvoiceCalcService calcService, PaymentRepository paymentRepository) {
        this.calcService = calcService;
        this.paymentRepository = paymentRepository;
    }

    /** Summary of a single invoice, loading its payments from the database. */
    public InvoiceSummary summarize(Invoice invoice) {
        List<Payment> payments = paymentRepository.findByInvoice_Id(invoice.getId());
        return summarize(invoice, payments, LocalDate.now());
    }

    /** Summary of many invoices using one payments query (avoids a query per invoice). */
    public List<InvoiceSummary> summarizeAll(List<Invoice> invoices, List<Payment> allPayments, LocalDate today) {
        Map<String, List<Payment>> byInvoice = allPayments.stream()
                .filter(p -> p.getInvoiceId() != null)
                .collect(Collectors.groupingBy(Payment::getInvoiceId));
        return invoices.stream()
                .map(inv -> summarize(inv, byInvoice.getOrDefault(inv.getId(), List.of()), today))
                .toList();
    }

    /** The core calculation. "today" is passed in so the logic is easy to test. */
    public InvoiceSummary summarize(Invoice invoice, Collection<Payment> payments, LocalDate today) {
        InvoiceCalcService.Totals totals = calcService.calcTotals(invoice);

        BigDecimal paid = payments.stream()
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal balance = totals.total().subtract(paid)
                .max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);

        String status = statusOf(invoice, totals.total(), paid, balance, today);

        long daysOverdue = 0;
        if (OVERDUE.equals(status)) {
            daysOverdue = ChronoUnit.DAYS.between(invoice.getDueDate(), today);
        }

        String customerName = invoice.getCustomer() != null ? invoice.getCustomer().getName() : "";

        return new InvoiceSummary(
                invoice.getId(),
                invoice.getNumber(),
                invoice.getCustomerId(),
                customerName,
                invoice.getIssueDate(),
                invoice.getDueDate(),
                totals.subtotal(),
                totals.discount(),
                totals.tax(),
                totals.total(),
                paid,
                balance,
                status,
                daysOverdue);
    }

    private String statusOf(Invoice invoice, BigDecimal total, BigDecimal paid, BigDecimal balance, LocalDate today) {
        if (Boolean.TRUE.equals(invoice.getIsDraft())) {
            return DRAFT;
        }
        if (total.signum() > 0 && balance.signum() == 0) {
            return PAID;
        }
        if (invoice.getDueDate() != null && today.isAfter(invoice.getDueDate())) {
            return OVERDUE;
        }
        if (paid.signum() > 0) {
            return PARTIAL;
        }
        return UNPAID;
    }
}
