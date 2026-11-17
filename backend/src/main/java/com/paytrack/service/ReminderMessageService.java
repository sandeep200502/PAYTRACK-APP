package com.paytrack.service;

import com.paytrack.security.CurrentUser;
import com.paytrack.dto.InvoiceSummary;
import com.paytrack.dto.ReminderMessage;
import com.paytrack.dto.ReminderSuggestion;
import com.paytrack.exception.ApiException;
import com.paytrack.model.Customer;
import com.paytrack.model.Invoice;
import com.paytrack.model.Reminder;
import com.paytrack.model.Settings;
import com.paytrack.repository.InvoiceRepository;
import com.paytrack.repository.PaymentRepository;
import com.paytrack.repository.ReminderRepository;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Writes payment reminder messages and decides which overdue invoices need one. */
@Service
public class ReminderMessageService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);

    /** Do not nag: a reminder is only "due" again after this many days. */
    private static final int MIN_DAYS_BETWEEN_REMINDERS = 3;

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ReminderRepository reminderRepository;
    private final InvoiceStatusService statusService;
    private final SettingsService settingsService;

    public ReminderMessageService(InvoiceRepository invoiceRepository, PaymentRepository paymentRepository,
                                  ReminderRepository reminderRepository, InvoiceStatusService statusService,
                                  SettingsService settingsService) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.reminderRepository = reminderRepository;
        this.statusService = statusService;
        this.settingsService = settingsService;
    }

    /** friendly for a few days late, firm for a month, final after that. */
    public static String toneForDaysOverdue(long daysOverdue) {
        if (daysOverdue <= 7) return "friendly";
        if (daysOverdue <= 30) return "firm";
        return "final";
    }

    public ReminderMessage compose(String invoiceId, String channelInput, String toneInput) {
        Invoice invoice = invoiceRepository.findByIdAndOwnerId(invoiceId, CurrentUser.id())
                .orElseThrow(() -> ApiException.notFound("Not found"));
        InvoiceSummary s = statusService.summarize(invoice);

        if (InvoiceStatusService.DRAFT.equals(s.status())) {
            throw ApiException.unprocessable("This invoice is still a draft");
        }
        if (s.balance().signum() <= 0) {
            throw ApiException.unprocessable("This invoice is already fully paid");
        }

        String channel = normaliseChannel(channelInput);
        String tone = toneInput == null || toneInput.isBlank()
                ? toneForDaysOverdue(s.daysOverdue())
                : toneInput.trim().toLowerCase();
        if (!List.of("friendly", "firm", "final").contains(tone)) {
            throw ApiException.badRequest("Tone must be friendly, firm or final");
        }

        Settings settings = settingsService.get();
        Customer customer = invoice.getCustomer();

        String contact = customer != null && customer.getContactPerson() != null && !customer.getContactPerson().isBlank()
                ? customer.getContactPerson()
                : (customer != null && customer.getName() != null ? customer.getName() : "there");
        String amount = "Rs " + String.format(Locale.US, "%,.2f", s.balance());
        String due = s.dueDate() == null ? "" : s.dueDate().format(DATE_FORMAT);
        String sender = (settings.getOwnerName() == null ? "" : settings.getOwnerName())
                + (settings.getName() == null ? "" : "\n" + settings.getName());

        StringBuilder body = new StringBuilder();
        String subject;
        switch (tone) {
            case "friendly":
                subject = "Reminder: invoice " + s.number();
                body.append("Hi ").append(contact).append(",\n\n")
                        .append("Just a gentle reminder that invoice ").append(s.number())
                        .append(" for ").append(amount)
                        .append(s.daysOverdue() > 0 ? " was due on " : " is due on ").append(due).append(".\n")
                        .append("If you have already paid, please ignore this message.\n");
                break;
            case "firm":
                subject = "Payment overdue: invoice " + s.number();
                body.append("Dear ").append(contact).append(",\n\n")
                        .append("Invoice ").append(s.number()).append(" for ").append(amount)
                        .append(" was due on ").append(due).append(" and is now ")
                        .append(s.daysOverdue()).append(" day(s) overdue.\n")
                        .append("Please arrange the payment at the earliest.\n");
                break;
            default:
                subject = "FINAL NOTICE: invoice " + s.number();
                body.append("Dear ").append(contact).append(",\n\n")
                        .append("This is the final reminder for invoice ").append(s.number())
                        .append(" of ").append(amount).append(", overdue by ").append(s.daysOverdue())
                        .append(" days (due ").append(due).append(").\n")
                        .append("Please clear the dues immediately to avoid further action.\n");
                break;
        }
        if (settings.getUpiId() != null && !settings.getUpiId().isBlank()) {
            body.append("\nYou can pay by UPI to: ").append(settings.getUpiId()).append("\n");
        }
        body.append("\nThank you,\n").append(sender);

        String text = body.toString();
        String link = buildLink(channel, invoice, subject, text);
        return new ReminderMessage(invoice.getId(), channel, tone, subject, text, link);
    }

    /** Every overdue invoice, oldest debt first, with the tone / channel we recommend. */
    public List<ReminderSuggestion> suggestions() {
        LocalDate today = LocalDate.now();
        List<Invoice> invoices = invoiceRepository.findByOwnerId(CurrentUser.id());
        Map<String, Invoice> invoiceById = new HashMap<>();
        for (Invoice i : invoices) {
            invoiceById.put(i.getId(), i);
        }

        Map<String, LocalDate> lastReminder = new HashMap<>();
        for (Reminder r : reminderRepository.findByOwnerId(CurrentUser.id())) {
            if (r.getInvoiceId() != null && r.getDate() != null) {
                lastReminder.merge(r.getInvoiceId(), r.getDate(), (a, b) -> a.isAfter(b) ? a : b);
            }
        }

        return statusService.summarizeAll(invoices, paymentRepository.findByOwnerId(CurrentUser.id()), today).stream()
                .filter(s -> InvoiceStatusService.OVERDUE.equals(s.status()))
                .sorted(Comparator.comparingLong(InvoiceSummary::daysOverdue).reversed())
                .map(s -> {
                    Invoice invoice = invoiceById.get(s.invoiceId());
                    boolean hasPhone = invoice.getCustomerPhone() != null && !invoice.getCustomerPhone().isBlank();
                    LocalDate last = lastReminder.get(s.invoiceId());
                    boolean due = last == null || last.plusDays(MIN_DAYS_BETWEEN_REMINDERS).isBefore(today);
                    return new ReminderSuggestion(s, toneForDaysOverdue(s.daysOverdue()),
                            hasPhone ? "WhatsApp" : "Email", last, due);
                })
                .toList();
    }

    private String normaliseChannel(String channel) {
        if (channel == null || channel.isBlank() || "whatsapp".equalsIgnoreCase(channel.trim())) {
            return "WhatsApp";
        }
        if ("email".equalsIgnoreCase(channel.trim())) {
            return "Email";
        }
        throw ApiException.badRequest("Channel must be Email or WhatsApp");
    }

    private String buildLink(String channel, Invoice invoice, String subject, String text) {
        if ("Email".equals(channel)) {
            if (invoice.getCustomerEmail() == null || invoice.getCustomerEmail().isBlank()) return null;
            return "mailto:" + invoice.getCustomerEmail() + "?subject=" + enc(subject) + "&body=" + enc(text);
        }
        if (invoice.getCustomerPhone() == null) return null;
        String digits = invoice.getCustomerPhone().replaceAll("\\D", "");
        if (digits.isEmpty()) return null;
        if (digits.length() == 10) digits = "91" + digits; // assume India for 10 digit numbers
        return "https://wa.me/" + digits + "?text=" + enc(text);
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
