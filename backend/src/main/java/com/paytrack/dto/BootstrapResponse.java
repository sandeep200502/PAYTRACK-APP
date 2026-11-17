package com.paytrack.dto;

import com.paytrack.model.Customer;
import com.paytrack.model.Invoice;
import com.paytrack.model.Payment;
import com.paytrack.model.Reminder;
import com.paytrack.model.Settings;

import java.util.List;

/** Shape returned by GET /api/bootstrap — everything the frontend needs in one call. */
public class BootstrapResponse {
    private List<Customer> customers;
    private List<Invoice> invoices;
    private List<Payment> payments;
    private List<Reminder> reminders;
    private Settings settings;

    public BootstrapResponse(List<Customer> customers, List<Invoice> invoices, List<Payment> payments,
                              List<Reminder> reminders, Settings settings) {
        this.customers = customers;
        this.invoices = invoices;
        this.payments = payments;
        this.reminders = reminders;
        this.settings = settings;
    }

    public List<Customer> getCustomers() { return customers; }
    public List<Invoice> getInvoices() { return invoices; }
    public List<Payment> getPayments() { return payments; }
    public List<Reminder> getReminders() { return reminders; }
    public Settings getSettings() { return settings; }
}
