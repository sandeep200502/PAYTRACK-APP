package com.paytrack.controller;

import com.paytrack.exception.ApiException;
import com.paytrack.security.CurrentUser;
import com.paytrack.dto.BootstrapResponse;
import com.paytrack.repository.CustomerRepository;
import com.paytrack.repository.InvoiceRepository;
import com.paytrack.repository.PaymentRepository;
import com.paytrack.repository.ReminderRepository;
import com.paytrack.service.SeedService;
import com.paytrack.service.SettingsService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    private final SeedService seedService;
    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ReminderRepository reminderRepository;
    private final SettingsService settingsService;

    public SystemController(SeedService seedService, CustomerRepository customerRepository,
                             InvoiceRepository invoiceRepository, PaymentRepository paymentRepository,
                             ReminderRepository reminderRepository, SettingsService settingsService) {
        this.seedService = seedService;
        this.customerRepository = customerRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.reminderRepository = reminderRepository;
        this.settingsService = settingsService;
    }

    /** Restores the sample demo dataset. Matches POST /api/system/reset. */
    @PostMapping("/reset")
    public BootstrapResponse reset() {
        noAdmin();
        seedService.reseed();
        return dump();
    }

    /** Wipes customers/invoices/payments/reminders, keeps settings. Matches POST /api/system/clear. */
    @PostMapping("/clear")
    public BootstrapResponse clear() {
        noAdmin();
        seedService.clearTransactional();
        return dump();
    }

    /** The admin account holds no business data, so demo reset and clear are for normal users only. */
    private void noAdmin() {
        if (CurrentUser.isAdmin()) throw ApiException.forbidden("The administrator account has no demo data");
    }

    private BootstrapResponse dump() {
        return new BootstrapResponse(
                customerRepository.findByOwnerId(CurrentUser.id()),
                invoiceRepository.findByOwnerId(CurrentUser.id()),
                paymentRepository.findByOwnerId(CurrentUser.id()),
                reminderRepository.findByOwnerId(CurrentUser.id()),
                settingsService.get());
    }
}
