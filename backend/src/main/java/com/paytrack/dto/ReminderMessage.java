package com.paytrack.dto;

/**
 * A ready to send payment reminder. "link" is a wa.me link (WhatsApp) or a
 * mailto: link (Email) that opens the app with the text already filled in.
 */
public record ReminderMessage(
        String invoiceId,
        String channel,
        String tone,
        String subject,
        String body,
        String link) {
}
