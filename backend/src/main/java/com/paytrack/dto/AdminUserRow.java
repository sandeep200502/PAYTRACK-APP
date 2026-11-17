package com.paytrack.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** One account as the admin sees it: who they are and how much they use the app, never their data. */
public record AdminUserRow(Long id, String name, String email, String role, boolean active,
                           LocalDate createdAt, LocalDateTime lastLoginAt,
                           long customers, long invoices, long payments) {
}
