package com.paytrack.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PaymentRequest {
    private String id;
    private String number;
    private String invoiceId;
    private BigDecimal amount;
    private String method;
    private LocalDate date;
    private String reference;
    private String note;
    private LocalDate createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNumber() { return number; }
    public void setNumber(String number) { this.number = number; }
    public String getInvoiceId() { return invoiceId; }
    public void setInvoiceId(String invoiceId) { this.invoiceId = invoiceId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public LocalDate getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }
}
