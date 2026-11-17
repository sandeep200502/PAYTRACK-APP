package com.paytrack.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Request body for POST/PATCH /api/invoices. */
public class InvoiceRequest {
    private String id;
    private String number;
    private String customerId;
    private String customerEmail;
    private String customerPhone;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private List<InvoiceItemRequest> items;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal taxRate;
    private String notes;
    private Boolean isDraft;
    private LocalDate createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNumber() { return number; }
    public void setNumber(String number) { this.number = number; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public List<InvoiceItemRequest> getItems() { return items; }
    public void setItems(List<InvoiceItemRequest> items) { this.items = items; }
    public String getDiscountType() { return discountType; }
    public void setDiscountType(String discountType) { this.discountType = discountType; }
    public BigDecimal getDiscountValue() { return discountValue; }
    public void setDiscountValue(BigDecimal discountValue) { this.discountValue = discountValue; }
    public BigDecimal getTaxRate() { return taxRate; }
    public void setTaxRate(BigDecimal taxRate) { this.taxRate = taxRate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Boolean getIsDraft() { return isDraft; }
    public void setIsDraft(Boolean isDraft) { this.isDraft = isDraft; }
    public LocalDate getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }
}
