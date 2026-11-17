package com.paytrack.controller;

import com.paytrack.security.CurrentUser;
import com.paytrack.dto.BootstrapResponse;
import com.paytrack.repository.CustomerRepository;
import com.paytrack.repository.InvoiceRepository;
import com.paytrack.repository.PaymentRepository;
import com.paytrack.repository.ReminderRepository;
import com.paytrack.service.SettingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BootstrapController {

    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ReminderRepository reminderRepository;
    private final SettingsService settingsService;

    public BootstrapController(CustomerRepository customerRepository, InvoiceRepository invoiceRepository,
                                PaymentRepository paymentRepository, ReminderRepository reminderRepository,
                                SettingsService settingsService) {
        this.customerRepository = customerRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.reminderRepository = reminderRepository;
        this.settingsService = settingsService;
    }

    /** Everything the frontend needs in one call, matching GET /api/bootstrap on the Express server. */
    @GetMapping("/api/bootstrap")
    public BootstrapResponse bootstrap() {
        return new BootstrapResponse(
                customerRepository.findByOwnerId(CurrentUser.id()),
                invoiceRepository.findByOwnerId(CurrentUser.id()),
                paymentRepository.findByOwnerId(CurrentUser.id()),
                reminderRepository.findByOwnerId(CurrentUser.id()),
                settingsService.get());
    }
}
