package com.paytrack.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/** Business profile settings. One row per user; its id is the user's id. */
@Entity
@Table(name = "settings")
public class Settings {

    @Id
    private Long id;

    private String name;
    private String ownerName;
    private String email;
    private String phone;

    @Column(length = 1000)
    private String address;

    private String gstin;
    private String upiId;
    private String invoicePrefix;
    private BigDecimal defaultTaxRate;
    private Integer defaultDueDays;

    public Settings() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getGstin() {
        return gstin;
    }

    public void setGstin(String gstin) {
        this.gstin = gstin;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
    }

    public String getInvoicePrefix() {
        return invoicePrefix;
    }

    public void setInvoicePrefix(String invoicePrefix) {
        this.invoicePrefix = invoicePrefix;
    }

    public BigDecimal getDefaultTaxRate() {
        return defaultTaxRate;
    }

    public void setDefaultTaxRate(BigDecimal defaultTaxRate) {
        this.defaultTaxRate = defaultTaxRate;
    }

    public Integer getDefaultDueDays() {
        return defaultDueDays;
    }

    public void setDefaultDueDays(Integer defaultDueDays) {
        this.defaultDueDays = defaultDueDays;
    }
}
