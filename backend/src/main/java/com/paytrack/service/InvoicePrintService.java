package com.paytrack.service;

import com.paytrack.security.CurrentUser;
import com.paytrack.dto.InvoiceSummary;
import com.paytrack.exception.ApiException;
import com.paytrack.model.Customer;
import com.paytrack.model.Invoice;
import com.paytrack.model.InvoiceItem;
import com.paytrack.model.Settings;
import com.paytrack.repository.InvoiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Renders a clean, printable invoice page. Open it in a browser and press
 * Ctrl+P / "Save as PDF" to get a PDF without any extra library.
 */
@Service
public class InvoicePrintService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);

    private final InvoiceRepository invoiceRepository;
    private final InvoiceStatusService statusService;
    private final SettingsService settingsService;

    public InvoicePrintService(InvoiceRepository invoiceRepository, InvoiceStatusService statusService,
                               SettingsService settingsService) {
        this.invoiceRepository = invoiceRepository;
        this.statusService = statusService;
        this.settingsService = settingsService;
    }

    public String render(String invoiceId) {
        Invoice invoice = invoiceRepository.findByIdAndOwnerId(invoiceId, CurrentUser.id())
                .orElseThrow(() -> ApiException.notFound("Not found"));
        InvoiceSummary s = statusService.summarize(invoice);
        Settings biz = settingsService.get();
        Customer customer = invoice.getCustomer();

        StringBuilder h = new StringBuilder();
        h.append("<!doctype html><html><head><meta charset=\"utf-8\">")
                .append("<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">")
                .append("<title>Invoice ").append(esc(s.number())).append("</title>")
                .append("<style>")
                .append("body{font-family:Arial,sans-serif;max-width:800px;margin:24px auto;padding:0 16px;color:#222}")
                .append("h1{margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}")
                .append("th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}")
                .append("td.r,th.r{text-align:right}.tot td{border:none;padding:4px 8px}")
                .append(".badge{display:inline-block;padding:2px 10px;border:1px solid #222;border-radius:12px;font-size:13px}")
                .append("@media print{button{display:none}}")
                .append("</style></head><body>");

        h.append("<button onclick=\"window.print()\">Print / Save as PDF</button>");
        h.append("<h1>").append(esc(biz.getName())).append("</h1>");
        h.append("<div>").append(esc(biz.getAddress())).append("<br>GSTIN: ").append(esc(biz.getGstin()))
                .append(" | ").append(esc(biz.getPhone())).append(" | ").append(esc(biz.getEmail())).append("</div>");

        h.append("<h2>Invoice ").append(esc(s.number())).append(" <span class=\"badge\">")
                .append(esc(s.status())).append("</span></h2>");
        h.append("<div>Issued: ").append(s.issueDate() == null ? "-" : s.issueDate().format(DATE_FORMAT))
                .append(" &nbsp; Due: ").append(s.dueDate() == null ? "-" : s.dueDate().format(DATE_FORMAT)).append("</div>");

        h.append("<p><b>Bill to:</b><br>").append(esc(customer == null ? "" : customer.getName()));
        if (customer != null) {
            h.append("<br>").append(esc(customer.getCity()))
                    .append("<br>GSTIN: ").append(esc(customer.getGstin()));
        }
        h.append("</p>");

        h.append("<table><tr><th>#</th><th>Description</th><th class=\"r\">Qty</th>")
                .append("<th class=\"r\">Rate</th><th class=\"r\">Amount</th></tr>");
        int n = 1;
        for (InvoiceItem item : invoice.getItems()) {
            BigDecimal qty = BigDecimal.valueOf(item.getQuantity() == null ? 0 : item.getQuantity());
            BigDecimal rate = item.getUnitPrice() == null ? BigDecimal.ZERO : item.getUnitPrice();
            h.append("<tr><td>").append(n++).append("</td><td>").append(esc(item.getDescription()))
                    .append("</td><td class=\"r\">").append(item.getQuantity() == null ? 0 : item.getQuantity())
                    .append("</td><td class=\"r\">").append(money(rate))
                    .append("</td><td class=\"r\">").append(money(qty.multiply(rate))).append("</td></tr>");
        }
        h.append("</table>");

        h.append("<table class=\"tot\" style=\"width:320px;margin-left:auto\">")
                .append(row("Subtotal", s.subtotal()))
                .append(row("Discount", s.discount().negate()))
                .append(row("GST (" + (invoice.getTaxRate() == null ? "0" : invoice.getTaxRate().stripTrailingZeros().toPlainString()) + "%)", s.tax()))
                .append(row("<b>Total</b>", s.total()))
                .append(row("Paid", s.paid()))
                .append(row("<b>Balance due</b>", s.balance()))
                .append("</table>");

        if (biz.getUpiId() != null && !biz.getUpiId().isBlank()) {
            h.append("<p>Pay by UPI: <b>").append(esc(biz.getUpiId())).append("</b></p>");
        }
        if (invoice.getNotes() != null && !invoice.getNotes().isBlank()) {
            h.append("<p><i>").append(esc(invoice.getNotes())).append("</i></p>");
        }
        h.append("</body></html>");
        return h.toString();
    }

    private static String row(String label, BigDecimal value) {
        return "<tr><td>" + label + "</td><td class=\"r\">" + money(value) + "</td></tr>";
    }

    private static String money(BigDecimal value) {
        return "Rs " + String.format(Locale.US, "%,.2f", value);
    }

    /** Escape user text so a customer name like <script> cannot inject HTML. */
    private static String esc(String value) {
        return value == null ? "" : HtmlUtils.htmlEscape(value);
    }
}
