package com.paytrack.service;

import com.paytrack.security.CurrentUser;
import com.paytrack.dto.ReminderRequest;
import com.paytrack.exception.ApiException;
import com.paytrack.model.Invoice;
import com.paytrack.model.Reminder;
import com.paytrack.repository.InvoiceRepository;
import com.paytrack.repository.ReminderRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReminderService {

    private final ReminderRepository repository;
    private final InvoiceRepository invoiceRepository;

    public ReminderService(ReminderRepository repository, InvoiceRepository invoiceRepository) {
        this.repository = repository;
        this.invoiceRepository = invoiceRepository;
    }

    public List<Reminder> findAll() {
        return repository.findByOwnerId(CurrentUser.id());
    }

    public Reminder findByIdOrThrow(String id) {
        return repository.findByIdAndOwnerId(id, CurrentUser.id()).orElseThrow(() -> ApiException.notFound("Not found"));
    }

    public Reminder create(ReminderRequest request) {
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

        Reminder reminder = new Reminder();
        reminder.setId(request.getId());
        reminder.setOwnerId(CurrentUser.id());
        reminder.setInvoice(invoice);
        reminder.setChannel(request.getChannel());
        reminder.setTone(request.getTone());
        reminder.setDate(request.getDate() != null ? request.getDate() : LocalDate.now());
        return repository.save(reminder);
    }

    public void delete(String id) {
        if (!repository.existsByIdAndOwnerId(id, CurrentUser.id())) {
            throw ApiException.notFound("Not found");
        }
        repository.deleteById(id);
    }
}
