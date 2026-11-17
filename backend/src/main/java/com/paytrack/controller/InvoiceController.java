package com.paytrack.controller;

import com.paytrack.dto.InvoiceRequest;
import com.paytrack.model.Invoice;
import com.paytrack.service.InvoiceService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService service;

    public InvoiceController(InvoiceService service) {
        this.service = service;
    }

    @GetMapping
    public List<Invoice> all() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Invoice byId(@PathVariable String id) {
        return service.findByIdOrThrow(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Invoice create(@RequestBody InvoiceRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}")
    public Invoice update(@PathVariable String id, @RequestBody InvoiceRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}
