package com.paytrack.service;

import com.paytrack.security.CurrentUser;
import com.paytrack.dto.CustomerStatement;
import com.paytrack.dto.InvoiceSummary;
import com.paytrack.exception.ApiException;
import com.paytrack.model.Customer;
import com.paytrack.model.Invoice;
import com.paytrack.model.Payment;
import com.paytrack.repository.CustomerRepository;
import com.paytrack.repository.InvoiceRepository;
import com.paytrack.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/** Customer account statement: all non-draft invoices, all payments and the balance owed. */
@Service
public class StatementService {

    private static final BigDecimal ZERO = new BigDecimal("0.00");

    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceStatusService statusService;

    public StatementService(CustomerRepository customerRepository, InvoiceRepository invoiceRepository,
                            PaymentRepository paymentRepository, InvoiceStatusService statusService) {
        this.customerRepository = customerRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.statusService = statusService;
    }

    public CustomerStatement build(String customerId) {
        Customer customer = customerRepository.findByIdAndOwnerId(customerId, CurrentUser.id())
                .orElseThrow(() -> ApiException.notFound("Not found"));
        LocalDate today = LocalDate.now();

        List<Invoice> invoices = invoiceRepository.findByCustomer_Id(customerId).stream()
                .filter(i -> !Boolean.TRUE.equals(i.getIsDraft()))
                .toList();
        Set<String> ids = invoices.stream().map(Invoice::getId).collect(Collectors.toSet());

        List<Payment> payments = paymentRepository.findByOwnerId(CurrentUser.id()).stream()
                .filter(p -> ids.contains(p.getInvoiceId()))
                .sorted(Comparator.comparing(Payment::getDate, Comparator.nullsLast(Comparator.<LocalDate>naturalOrder())))
                .toList();

        List<InvoiceSummary> summaries = statusService.summarizeAll(invoices, payments, today).stream()
                .sorted(Comparator.comparing(InvoiceSummary::issueDate, Comparator.nullsLast(Comparator.<LocalDate>naturalOrder())))
                .toList();

        BigDecimal billed = summaries.stream().map(InvoiceSummary::total).reduce(ZERO, BigDecimal::add);
        BigDecimal paid = summaries.stream().map(InvoiceSummary::paid).reduce(ZERO, BigDecimal::add);
        BigDecimal outstanding = summaries.stream().map(InvoiceSummary::balance).reduce(ZERO, BigDecimal::add);

        return new CustomerStatement(customer, today, summaries, payments, billed, paid, outstanding);
    }
}
