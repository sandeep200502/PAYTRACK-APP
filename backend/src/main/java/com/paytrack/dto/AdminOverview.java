package com.paytrack.dto;

import java.math.BigDecimal;

/** Platform-wide numbers for the admin page. Totals only: no invoice or customer details. */
public record AdminOverview(long users, long admins, long disabledUsers,
                            long customers, long invoices, long payments,
                            BigDecimal totalCollected, long newUsersLast7Days) {
}
