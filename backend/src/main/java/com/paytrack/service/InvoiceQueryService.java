package com.paytrack.service;

import com.paytrack.security.CurrentUser;
import com.paytrack.dto.InvoiceSummary;
import com.paytrack.dto.UpiLink;
import com.paytrack.exception.ApiException;
import com.paytrack.model.Invoice;
import com.paytrack.model.Settings;
import com.paytrack.repository.InvoiceRepository;
import com.paytrack.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/** Search / filter / sort invoices, suggest the next invoice number, build UPI payment links. */
@Service
public class InvoiceQueryService {

    private static final Pattern TRAILING_DIGITS = Pattern.compile("(\\d+)$");

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceStatusService statusService;
    private final SettingsService settingsService;

    public InvoiceQueryService(InvoiceRepository invoiceRepository, PaymentRepository paymentRepository,
                               InvoiceStatusService statusService, SettingsService settingsService) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.statusService = statusService;
        this.settingsService = settingsService;
    }

    public Invoice findInvoice(String id) {
        return invoiceRepository.findByIdAndOwnerId(id, CurrentUser.id()).orElseThrow(() -> ApiException.notFound("Not found"));
    }

    public InvoiceSummary summary(String id) {
        return statusService.summarize(findInvoice(id));
    }

    /**
     * Filters are all optional. Anything left null / blank is ignored.
     * sortBy: dueDate (default), issueDate, total, balance, number
     */
    public List<InvoiceSummary> search(String status, String customerId, String q,
                                       LocalDate from, LocalDate to, String sortBy, boolean desc) {
        if (status != null && !status.isBlank()
                && InvoiceStatusService.ALL_STATUSES.stream().noneMatch(s -> s.equalsIgnoreCase(status.trim()))) {
            throw ApiException.badRequest("Unknown status. Use one of " + InvoiceStatusService.ALL_STATUSES);
        }

        Stream<InvoiceSummary> stream = statusService
                .summarizeAll(invoiceRepository.findByOwnerId(CurrentUser.id()), paymentRepository.findByOwnerId(CurrentUser.id()), LocalDate.now())
                .stream();

        if (status != null && !status.isBlank()) {
            stream = stream.filter(s -> s.status().equalsIgnoreCase(status.trim()));
        }
        if (customerId != null && !customerId.isBlank()) {
            stream = stream.filter(s -> customerId.equals(s.customerId()));
        }
        if (q != null && !q.isBlank()) {
            String needle = q.trim().toLowerCase();
            stream = stream.filter(s ->
                    (s.number() != null && s.number().toLowerCase().contains(needle))
                            || (s.customerName() != null && s.customerName().toLowerCase().contains(needle)));
        }
        if (from != null) {
            stream = stream.filter(s -> s.issueDate() != null && !s.issueDate().isBefore(from));
        }
        if (to != null) {
            stream = stream.filter(s -> s.issueDate() != null && !s.issueDate().isAfter(to));
        }

        Comparator<InvoiceSummary> comparator = comparatorFor(sortBy);
        if (desc) {
            comparator = comparator.reversed();
        }
        return stream.sorted(comparator).toList();
    }

    private Comparator<InvoiceSummary> comparatorFor(String sortBy) {
        String key = sortBy == null || sortBy.isBlank() ? "dueDate" : sortBy;
        Comparator<LocalDate> dates = Comparator.nullsLast(Comparator.<LocalDate>naturalOrder());
        switch (key) {
            case "issueDate":
                return Comparator.comparing(InvoiceSummary::issueDate, dates);
            case "total":
                return Comparator.comparing(InvoiceSummary::total);
            case "balance":
                return Comparator.comparing(InvoiceSummary::balance);
            case "number":
                return Comparator.comparing(s -> s.number() == null ? "" : s.number());
            case "dueDate":
                return Comparator.comparing(InvoiceSummary::dueDate, dates);
            default:
                throw ApiException.badRequest("Unknown sortBy. Use dueDate, issueDate, total, balance or number");
        }
    }

    /** Next invoice number = prefix from Settings + (highest number used so far + 1). */
    public String nextInvoiceNumber() {
        Settings settings = settingsService.get();
        String prefix = settings.getInvoicePrefix() == null || settings.getInvoicePrefix().isBlank()
                ? "INV-" : settings.getInvoicePrefix();

        long highest = 1000;
        for (Invoice invoice : invoiceRepository.findByOwnerId(CurrentUser.id())) {
            if (invoice.getNumber() == null) continue;
            Matcher m = TRAILING_DIGITS.matcher(invoice.getNumber());
            if (m.find()) {
                highest = Math.max(highest, Long.parseLong(m.group(1)));
            }
        }
        return prefix + (highest + 1);
    }

    /** upi://pay deep link for the amount still unpaid on this invoice. */
    public UpiLink upiLink(String invoiceId) {
        Invoice invoice = findInvoice(invoiceId);
        InvoiceSummary s = statusService.summarize(invoice);
        Settings settings = settingsService.get();

        if (settings.getUpiId() == null || settings.getUpiId().isBlank()) {
            throw ApiException.unprocessable("Set your UPI id in Settings first");
        }
        if (s.balance().signum() <= 0) {
            throw ApiException.unprocessable("Nothing left to pay on this invoice");
        }

        String businessName = settings.getName() == null ? "" : settings.getName();
        String link = "upi://pay?pa=" + enc(settings.getUpiId())
                + "&pn=" + enc(businessName)
                + "&am=" + s.balance().toPlainString()
                + "&cu=INR"
                + "&tn=" + enc("Invoice " + s.number());
        return new UpiLink(s.number(), s.balance(), settings.getUpiId(), link);
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
