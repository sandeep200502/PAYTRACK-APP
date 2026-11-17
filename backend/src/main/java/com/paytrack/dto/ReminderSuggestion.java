package com.paytrack.dto;

import java.time.LocalDate;

/** One overdue invoice plus what PayTrack recommends doing about it. */
public record ReminderSuggestion(
        InvoiceSummary invoice,
        String suggestedTone,
        String suggestedChannel,
        LocalDate lastReminderDate,
        boolean reminderDue) {
}
