package com.paytrack.dto;

import java.time.LocalDate;

public class ReminderRequest {
    private String id;
    private String invoiceId;
    private String channel;
    private String tone;
    private LocalDate date;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getInvoiceId() { return invoiceId; }
    public void setInvoiceId(String invoiceId) { this.invoiceId = invoiceId; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public String getTone() { return tone; }
    public void setTone(String tone) { this.tone = tone; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
}
