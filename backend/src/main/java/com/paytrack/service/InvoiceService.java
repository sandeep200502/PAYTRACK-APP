package com.paytrack.service;

import com.paytrack.security.CurrentUser;
import com.paytrack.dto.InvoiceItemRequest;
import com.paytrack.dto.InvoiceRequest;
import com.paytrack.exception.ApiException;
import com.paytrack.model.Customer;
import com.paytrack.model.Invoice;
import com.paytrack.model.InvoiceItem;
import com.paytrack.repository.CustomerRepository;
import com.paytrack.repository.InvoiceRepository;
import com.paytrack.repository.PaymentRepository;
import com.paytrack.repository.ReminderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class InvoiceService {

    private final InvoiceRepository repository;
    private final CustomerRepository customerRepository;
    private final PaymentRepository paymentRepository;
    private final ReminderRepository reminderRepository;

    public InvoiceService(InvoiceRepository repository, CustomerRepository customerRepository,
                          PaymentRepository paymentRepository, ReminderRepository reminderRepository) {
        this.repository = repository;
        this.customerRepository = customerRepository;
        this.paymentRepository = paymentRepository;
        this.reminderRepository = reminderRepository;
    }

    public List<Invoice> findAll() {
        return repository.findByOwnerId(CurrentUser.id());
    }

    public Invoice findByIdOrThrow(String id) {
        return repository.findByIdAndOwnerId(id, CurrentUser.id()).orElseThrow(() -> ApiException.notFound("Not found"));
    }

    public Invoice create(InvoiceRequest request) {
        if (request.getId() == null || request.getId().isBlank()) {
            throw ApiException.badRequest("Record id is required");
        }
        if (repository.existsById(request.getId())) {
            throw ApiException.conflict("A record with this id already exists");
        }
        validate(request, null);
        Invoice invoice = new Invoice();
        invoice.setId(request.getId());
        invoice.setOwnerId(CurrentUser.id());
        apply(invoice, request);
        if (invoice.getCreatedAt() == null) {
            invoice.setCreatedAt(LocalDate.now());
        }
        if (invoice.getIsDraft() == null) {
            invoice.setIsDraft(false);
        }
        if (invoice.getDiscountType() == null) {
            invoice.setDiscountType("flat");
        }
        return repository.save(invoice);
    }

    public Invoice update(String id, InvoiceRequest request) {
        Invoice invoice = findByIdOrThrow(id);
        validate(request, invoice);
        apply(invoice, request);
        return repository.save(invoice);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsByIdAndOwnerId(id, CurrentUser.id())) {
            throw ApiException.notFound("Not found");
        }
        // Items cascade automatically (orphanRemoval). Payments and reminders
        // are removed here too, so deleting an invoice never fails on a foreign
        // key even if the client did not clean them up first.
        paymentRepository.deleteAll(paymentRepository.findByInvoice_Id(id));
        reminderRepository.deleteAll(reminderRepository.findByInvoice_Id(id));
        repository.deleteById(id);
    }

    /**
     * Business rules checked BEFORE anything is changed, so a bad request never
     * leaves a half-edited invoice behind. "existing" is null when creating.
     */
    private void validate(InvoiceRequest r, Invoice existing) {
        LocalDate issue = r.getIssueDate() != null ? r.getIssueDate() : (existing != null ? existing.getIssueDate() : null);
        LocalDate due = r.getDueDate() != null ? r.getDueDate() : (existing != null ? existing.getDueDate() : null);
        if (issue != null && due != null && due.isBefore(issue)) {
            throw ApiException.unprocessable("Due date cannot be before the issue date");
        }
        if (r.getTaxRate() != null
                && (r.getTaxRate().signum() < 0 || r.getTaxRate().compareTo(BigDecimal.valueOf(100)) > 0)) {
            throw ApiException.unprocessable("Tax rate must be between 0 and 100");
        }
        if (r.getDiscountValue() != null && r.getDiscountValue().signum() < 0) {
            throw ApiException.unprocessable("Discount cannot be negative");
        }
        String discountType = r.getDiscountType() != null ? r.getDiscountType()
                : (existing != null ? existing.getDiscountType() : null);
        if ("percent".equals(discountType) && r.getDiscountValue() != null
                && r.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw ApiException.unprocessable("A percentage discount cannot be more than 100");
        }
        if (r.getItems() != null) {
            for (InvoiceItemRequest item : r.getItems()) {
                if (item.getQuantity() != null && item.getQuantity() < 0) {
                    throw ApiException.unprocessable("Item quantity cannot be negative");
                }
                if (item.getUnitPrice() != null && item.getUnitPrice().signum() < 0) {
                    throw ApiException.unprocessable("Item price cannot be negative");
                }
            }
        }
        if (r.getNumber() != null && !r.getNumber().isBlank()) {
            String ownId = existing != null ? existing.getId() : r.getId();
            if (repository.existsByOwnerIdAndNumberAndIdNot(CurrentUser.id(), r.getNumber(), ownId == null ? "" : ownId)) {
                throw ApiException.conflict("Invoice number " + r.getNumber() + " is already used");
            }
        }
    }

    private void apply(Invoice invoice, InvoiceRequest r) {
        if (r.getNumber() != null) invoice.setNumber(r.getNumber());

        if (r.getCustomerId() != null) {
            Customer customer = customerRepository.findByIdAndOwnerId(r.getCustomerId(), CurrentUser.id())
                    .orElseThrow(() -> ApiException.badRequest("Customer not found"));
            invoice.setCustomer(customer);
        }

        if (r.getCustomerEmail() != null) invoice.setCustomerEmail(r.getCustomerEmail());
        if (r.getCustomerPhone() != null) invoice.setCustomerPhone(r.getCustomerPhone());
        if (r.getIssueDate() != null) invoice.setIssueDate(r.getIssueDate());
        if (r.getDueDate() != null) invoice.setDueDate(r.getDueDate());
        if (r.getDiscountType() != null) invoice.setDiscountType(r.getDiscountType());
        if (r.getDiscountValue() != null) invoice.setDiscountValue(r.getDiscountValue());
        if (r.getTaxRate() != null) invoice.setTaxRate(r.getTaxRate());
        if (r.getNotes() != null) invoice.setNotes(r.getNotes());
        if (r.getIsDraft() != null) invoice.setIsDraft(r.getIsDraft());
        if (r.getCreatedAt() != null) invoice.setCreatedAt(r.getCreatedAt());

        if (r.getItems() != null) {
            invoice.getItems().clear();
            List<InvoiceItem> items = new ArrayList<>();
            for (InvoiceItemRequest itemRequest : r.getItems()) {
                InvoiceItem item = new InvoiceItem();
                item.setId(itemRequest.getId() != null ? itemRequest.getId() : UUID.randomUUID().toString());
                item.setDescription(itemRequest.getDescription());
                item.setQuantity(itemRequest.getQuantity());
                item.setUnitPrice(itemRequest.getUnitPrice());
                item.setInvoice(invoice);
                items.add(item);
            }
            invoice.getItems().addAll(items);
        }
    }
}
