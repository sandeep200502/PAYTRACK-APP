package com.paytrack.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** Everything the dashboard screen needs, returned by GET /api/dashboard. */
public record DashboardResponse(
        LocalDate asOf,
        BigDecimal totalInvoiced,
        BigDecimal totalCollected,
        BigDecimal outstanding,
        BigDecimal overdueAmount,
        double collectionRatePercent,
        Map<String, Long> invoiceCountByStatus,
        Map<String, BigDecimal> agingBuckets,
        Map<String, BigDecimal> monthlyCollections,
        Map<String, BigDecimal> paymentMethodBreakdown,
        List<TopCustomer> topOutstandingCustomers) {

    /** One row of the "who owes me the most" list. */
    public record TopCustomer(String customerId, String customerName, BigDecimal outstanding) {
    }
}
