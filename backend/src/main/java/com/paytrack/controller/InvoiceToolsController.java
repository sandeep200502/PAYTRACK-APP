package com.paytrack.controller;

import com.paytrack.dto.InvoiceSummary;
import com.paytrack.dto.ReminderMessage;
import com.paytrack.dto.UpiLink;
import com.paytrack.service.InvoicePrintService;
import com.paytrack.service.InvoiceQueryService;
import com.paytrack.service.ReminderMessageService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Extra invoice endpoints that sit next to the plain CRUD ones in InvoiceController.
 * Fixed paths such as /search and /next-number win over the /{id} pattern.
 */
@RestController
@RequestMapping("/api/invoices")
public class InvoiceToolsController {

    private final InvoiceQueryService queryService;
    private final ReminderMessageService reminderMessageService;
    private final InvoicePrintService printService;

    public InvoiceToolsController(InvoiceQueryService queryService, ReminderMessageService reminderMessageService,
                                  InvoicePrintService printService) {
        this.queryService = queryService;
        this.reminderMessageService = reminderMessageService;
        this.printService = printService;
    }

    @GetMapping("/search")
    public List<InvoiceSummary> search(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String customerId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "false") boolean desc) {
        return queryService.search(status, customerId, q, from, to, sortBy, desc);
    }

    @GetMapping("/next-number")
    public Map<String, String> nextNumber() {
        return Map.of("number", queryService.nextInvoiceNumber());
    }

    @GetMapping("/{id}/summary")
    public InvoiceSummary summary(@PathVariable String id) {
        return queryService.summary(id);
    }

    @GetMapping("/{id}/upi-link")
    public UpiLink upiLink(@PathVariable String id) {
        return queryService.upiLink(id);
    }

    @GetMapping("/{id}/reminder-message")
    public ReminderMessage reminderMessage(@PathVariable String id,
                                           @RequestParam(required = false) String channel,
                                           @RequestParam(required = false) String tone) {
        return reminderMessageService.compose(id, channel, tone);
    }

    @GetMapping("/{id}/print")
    public ResponseEntity<String> print(@PathVariable String id) {
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "html", StandardCharsets.UTF_8))
                .body(printService.render(id));
    }
}
