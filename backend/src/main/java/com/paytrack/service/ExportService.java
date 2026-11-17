package com.paytrack.service;

import com.paytrack.security.CurrentUser;
import com.paytrack.dto.InvoiceSummary;
import com.paytrack.model.Payment;
import com.paytrack.repository.InvoiceRepository;
import com.paytrack.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/** Produces CSV text that opens directly in Excel / Google Sheets. */
@Service
public class ExportService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceStatusService statusService;

    public ExportService(InvoiceRepository invoiceRepository, PaymentRepository paymentRepository,
                         InvoiceStatusService statusService) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.statusService = statusService;
    }

    public String invoicesCsv() {
        List<InvoiceSummary> rows = statusService.summarizeAll(
                invoiceRepository.findByOwnerId(CurrentUser.id()), paymentRepository.findByOwnerId(CurrentUser.id()), LocalDate.now());

        StringBuilder sb = new StringBuilder();
        sb.append("Invoice No,Customer,Issue Date,Due Date,Subtotal,Discount,GST,Total,Paid,Balance,Status,Days Overdue\n");
        for (InvoiceSummary s : rows) {
            sb.append(text(s.number())).append(',')
                    .append(text(s.customerName())).append(',')
                    .append(s.issueDate() == null ? "" : s.issueDate()).append(',')
                    .append(s.dueDate() == null ? "" : s.dueDate()).append(',')
                    .append(s.subtotal()).append(',')
                    .append(s.discount()).append(',')
                    .append(s.tax()).append(',')
                    .append(s.total()).append(',')
                    .append(s.paid()).append(',')
                    .append(s.balance()).append(',')
                    .append(text(s.status())).append(',')
                    .append(s.daysOverdue()).append('\n');
        }
        return sb.toString();
    }

    public String paymentsCsv() {
        StringBuilder sb = new StringBuilder();
        sb.append("Payment No,Invoice No,Customer,Amount,Method,Date,Reference,Note\n");
        for (Payment p : paymentRepository.findByOwnerId(CurrentUser.id())) {
            String invoiceNo = p.getInvoice() == null ? "" : p.getInvoice().getNumber();
            String customer = (p.getInvoice() == null || p.getInvoice().getCustomer() == null)
                    ? "" : p.getInvoice().getCustomer().getName();
            sb.append(text(p.getNumber())).append(',')
                    .append(text(invoiceNo)).append(',')
                    .append(text(customer)).append(',')
                    .append(p.getAmount() == null ? "" : p.getAmount()).append(',')
                    .append(text(p.getMethod())).append(',')
                    .append(p.getDate() == null ? "" : p.getDate()).append(',')
                    .append(text(p.getReference())).append(',')
                    .append(text(p.getNote())).append('\n');
        }
        return sb.toString();
    }

    /**
     * Makes a text value safe for a CSV cell: wraps it in quotes when it has a
     * comma / quote / newline, and defuses spreadsheet formulas (=, +, -, @)
     * by putting a ' in front, so a malicious customer name cannot run a formula.
     */
    static String text(String value) {
        if (value == null) return "";
        String v = value;
        if (!v.isEmpty() && "=+-@".indexOf(v.charAt(0)) >= 0) {
            v = "'" + v;
        }
        if (v.contains(",") || v.contains("\"") || v.contains("\n")) {
            v = "\"" + v.replace("\"", "\"\"") + "\"";
        }
        return v;
    }
}
