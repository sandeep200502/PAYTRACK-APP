package com.paytrack.dto;

import java.time.LocalDateTime;

/** One line of the activity log as the admin page shows it. */
public record AuditEntry(Long id, LocalDateTime at, String admin, String action, String target) {
}
