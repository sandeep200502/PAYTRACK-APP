package com.paytrack.service;

import com.paytrack.security.CurrentUser;
import com.paytrack.dto.DashboardResponse;
import com.paytrack.dto.InvoiceSummary;
import com.paytrack.model.Payment;
import com.paytrack.repository.InvoiceRepository;
import com.paytrack.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Builds the numbers shown on the dashboard: totals, ageing, monthly collections, top debtors. */
@Service
public class DashboardService {

    static final String NOT_DUE = "Not yet due";
    static final String D1_30 = "1-30 days";
    static final String D31_60 = "31-60 days";
    static final String D61_90 = "61-90 days";
    static final String D90_PLUS = "90+ days";

    private static final BigDecimal ZERO = new BigDecimal("0.00");

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceStatusService statusService;

    public DashboardService(InvoiceRepository invoiceRepository, PaymentRepository paymentRepository,
                            InvoiceStatusService statusService) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.statusService = statusService;
    }

    public DashboardResponse build() {
        LocalDate today = LocalDate.now();
        List<Payment> payments = paymentRepository.findByOwnerId(CurrentUser.id());
        List<InvoiceSummary> all = statusService.summarizeAll(invoiceRepository.findByOwnerId(CurrentUser.id()), payments, today);

        // Drafts have not been sent to the customer yet, so they do not count as money owed.
        List<InvoiceSummary> live = all.stream()
                .filter(s -> !InvoiceStatusService.DRAFT.equals(s.status()))
                .toList();

        BigDecimal totalInvoiced = sum(live, InvoiceSummary::total);
        BigDecimal totalCollected = sum(live, InvoiceSummary::paid);
        BigDecimal outstanding = sum(live, InvoiceSummary::balance);
        BigDecimal overdueAmount = live.stream()
                .filter(s -> InvoiceStatusService.OVERDUE.equals(s.status()))
                .map(InvoiceSummary::balance)
                .reduce(ZERO, BigDecimal::add);

        double collectionRate = 0;
        if (totalInvoiced.signum() > 0) {
            collectionRate = totalCollected.multiply(BigDecimal.valueOf(100))
                    .divide(totalInvoiced, 1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        // Count of invoices per status. Every status is present, even with 0.
        Map<String, Long> counts = new LinkedHashMap<>();
        for (String status : InvoiceStatusService.ALL_STATUSES) {
            counts.put(status, 0L);
        }
        for (InvoiceSummary s : all) {
            counts.merge(s.status(), 1L, Long::sum);
        }

        // Ageing report: how long has the unpaid money been waiting?
        Map<String, BigDecimal> aging = new LinkedHashMap<>();
        for (String bucket : List.of(NOT_DUE, D1_30, D31_60, D61_90, D90_PLUS)) {
            aging.put(bucket, ZERO);
        }
        for (InvoiceSummary s : live) {
            if (s.balance().signum() > 0) {
                aging.merge(bucketFor(s.daysOverdue()), s.balance(), BigDecimal::add);
            }
        }

        // Payments that belong to non-draft invoices only.
        Set<String> liveIds = live.stream().map(InvoiceSummary::invoiceId).collect(Collectors.toSet());
        List<Payment> livePayments = payments.stream()
                .filter(p -> p.getAmount() != null && liveIds.contains(p.getInvoiceId()))
                .toList();

        // Collections for the last 6 calendar months (oldest first).
        Map<String, BigDecimal> monthly = new LinkedHashMap<>();
        YearMonth thisMonth = YearMonth.from(today);
        for (int i = 5; i >= 0; i--) {
            monthly.put(thisMonth.minusMonths(i).toString(), ZERO);
        }
        for (Payment p : livePayments) {
            if (p.getDate() != null) {
                String key = YearMonth.from(p.getDate()).toString();
                monthly.computeIfPresent(key, (k, v) -> v.add(p.getAmount()));
            }
        }

        // Money received per payment method (UPI, Cash, ...).
        Map<String, BigDecimal> byMethod = new LinkedHashMap<>();
        for (Payment p : livePayments) {
            String method = (p.getMethod() == null || p.getMethod().isBlank()) ? "Other" : p.getMethod();
            byMethod.merge(method, p.getAmount(), BigDecimal::add);
        }

        // Top 5 customers by unpaid amount.
        Map<String, BigDecimal> owedByCustomer = new HashMap<>();
        Map<String, String> names = new HashMap<>();
        for (InvoiceSummary s : live) {
            if (s.balance().signum() > 0 && s.customerId() != null) {
                owedByCustomer.merge(s.customerId(), s.balance(), BigDecimal::add);
                names.putIfAbsent(s.customerId(), s.customerName());
            }
        }
        List<DashboardResponse.TopCustomer> top = owedByCustomer.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(5)
                .map(e -> new DashboardResponse.TopCustomer(e.getKey(), names.get(e.getKey()), e.getValue()))
                .toList();

        return new DashboardResponse(today, totalInvoiced, totalCollected, outstanding, overdueAmount,
                collectionRate, counts, aging, monthly, byMethod, top);
    }

    private static BigDecimal sum(List<InvoiceSummary> list, java.util.function.Function<InvoiceSummary, BigDecimal> f) {
        return list.stream().map(f).reduce(ZERO, BigDecimal::add);
    }

    private static String bucketFor(long daysOverdue) {
        if (daysOverdue <= 0) return NOT_DUE;
        if (daysOverdue <= 30) return D1_30;
        if (daysOverdue <= 60) return D31_60;
        if (daysOverdue <= 90) return D61_90;
        return D90_PLUS;
    }
}
