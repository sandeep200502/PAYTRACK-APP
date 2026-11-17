package com.paytrack.dto;

import java.math.BigDecimal;

public class SettingsRequest {
    private String name;
    private String ownerName;
    private String email;
    private String phone;
    private String address;
    private String gstin;
    private String upiId;
    private String invoicePrefix;
    private BigDecimal defaultTaxRate;
    private Integer defaultDueDays;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }
    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }
    public String getInvoicePrefix() { return invoicePrefix; }
    public void setInvoicePrefix(String invoicePrefix) { this.invoicePrefix = invoicePrefix; }
    public BigDecimal getDefaultTaxRate() { return defaultTaxRate; }
    public void setDefaultTaxRate(BigDecimal defaultTaxRate) { this.defaultTaxRate = defaultTaxRate; }
    public Integer getDefaultDueDays() { return defaultDueDays; }
    public void setDefaultDueDays(Integer defaultDueDays) { this.defaultDueDays = defaultDueDays; }
}
