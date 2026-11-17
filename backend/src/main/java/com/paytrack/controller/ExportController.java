package com.paytrack.controller;

import com.paytrack.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    private final ExportService service;

    public ExportController(ExportService service) {
        this.service = service;
    }

    @GetMapping("/invoices.csv")
    public ResponseEntity<String> invoices() {
        return csv("invoices.csv", service.invoicesCsv());
    }

    @GetMapping("/payments.csv")
    public ResponseEntity<String> payments() {
        return csv("payments.csv", service.paymentsCsv());
    }

    private ResponseEntity<String> csv(String filename, String body) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(body);
    }
}
