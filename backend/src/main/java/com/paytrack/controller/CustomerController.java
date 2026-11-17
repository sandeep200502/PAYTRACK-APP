package com.paytrack.controller;

import com.paytrack.dto.CustomerRequest;
import com.paytrack.model.Customer;
import com.paytrack.service.CustomerService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService service;

    public CustomerController(CustomerService service) {
        this.service = service;
    }

    @GetMapping
    public List<Customer> all() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Customer byId(@PathVariable String id) {
        return service.findByIdOrThrow(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Customer create(@RequestBody CustomerRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}")
    public Customer update(@PathVariable String id, @RequestBody CustomerRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}
