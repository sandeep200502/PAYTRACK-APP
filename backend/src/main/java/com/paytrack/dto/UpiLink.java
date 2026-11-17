package com.paytrack.dto;

import java.math.BigDecimal;

/** A UPI deep link for the remaining balance of an invoice (opens GPay / PhonePe / Paytm). */
public record UpiLink(String invoiceNumber, BigDecimal amount, String upiId, String link) {
}
