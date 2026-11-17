package com.paytrack.service;

import com.paytrack.security.CurrentUser;
import com.paytrack.dto.PaymentRequest;
import com.paytrack.exception.ApiException;
import com.paytrack.model.Invoice;
import com.paytrack.model.Payment;
import com.paytrack.repository.InvoiceRepository;
import com.paytrack.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class PaymentService {

    private static final BigDecimal TOLERANCE = new BigDecimal("0.001");

    private final PaymentRepository repository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceCalcService invoiceCalcService;

    public PaymentService(PaymentRepository repository, InvoiceRepository invoiceRepository,
                           InvoiceCalcService invoiceCalcService) {
        this.repository = repository;
        this.invoiceRepository = invoiceRepository;
        this.invoiceCalcService = invoiceCalcService;
    }

    public List<Payment> findAll() {
        return repository.findByOwnerId(CurrentUser.id());
    }

    public Payment findByIdOrThrow(String id) {
        return repository.findByIdAndOwnerId(id, CurrentUser.id()).orElseThrow(() -> ApiException.notFound("Not found"));
    }

    /**
     * Server-side guard: never accept a payment larger than the invoice's
     * remaining balance. Mirrors the Express /api/payments POST handler
     * exactly, including the 0.001 rounding tolerance.
     */
    public Payment create(PaymentRequest request) {
        if (request.getId() == null || request.getId().isBlank()) {
            throw ApiException.badRequest("Record id is required");
        }
        if (repository.existsById(request.getId())) {
            throw ApiException.conflict("A record with this id already exists");
        }
        if (request.getInvoiceId() == null) {
            throw ApiException.badRequest("Invoice not found");
        }
        Invoice invoice = invoiceRepository.findByIdAndOwnerId(request.getInvoiceId(), CurrentUser.id())
                .orElseThrow(() -> ApiException.badRequest("Invoice not found"));

        if (Boolean.TRUE.equals(invoice.getIsDraft())) {
            throw ApiException.unprocessable("Cannot record a payment on a draft invoice");
        }

        BigDecimal paidSoFar = repository.findByInvoice_Id(invoice.getId()).stream()
                .map(Payment::getAmount)
                .filter(a -> a != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        InvoiceCalcService.Totals totals = invoiceCalcService.calcTotals(invoice);
        BigDecimal balance = totals.total().subtract(paidSoFar);

        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0
                || amount.compareTo(balance.add(TOLERANCE)) > 0) {
            throw ApiException.unprocessable(
                    "Amount must be between 1 and " + balance.setScale(2, RoundingMode.HALF_UP));
        }

        Payment payment = new Payment();
        payment.setId(request.getId());
        payment.setOwnerId(CurrentUser.id());
        payment.setNumber(request.getNumber());
        payment.setInvoice(invoice);
        payment.setAmount(amount);
        payment.setMethod(request.getMethod());
        payment.setDate(request.getDate() != null ? request.getDate() : LocalDate.now());
        payment.setReference(request.getReference());
        payment.setNote(request.getNote());
        payment.setCreatedAt(request.getCreatedAt() != null ? request.getCreatedAt() : LocalDate.now());
        return repository.save(payment);
    }

    public void delete(String id) {
        if (!repository.existsByIdAndOwnerId(id, CurrentUser.id())) {
            throw ApiException.notFound("Not found");
        }
        repository.deleteById(id);
    }
}
