package com.paytrack.service;

import com.paytrack.security.CurrentUser;
import com.paytrack.dto.CustomerRequest;
import com.paytrack.exception.ApiException;
import com.paytrack.model.Customer;
import com.paytrack.repository.CustomerRepository;
import com.paytrack.repository.InvoiceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class CustomerService {

    /** Indian GSTIN format: 2 digit state, 5 letters, 4 digits, 1 letter, 1 entity code, Z, 1 check char. */
    private static final Pattern GSTIN = Pattern.compile("^\\d{2}[A-Z]{5}\\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$");

    private final CustomerRepository repository;
    private final InvoiceRepository invoiceRepository;

    public CustomerService(CustomerRepository repository, InvoiceRepository invoiceRepository) {
        this.repository = repository;
        this.invoiceRepository = invoiceRepository;
    }

    public List<Customer> findAll() {
        return repository.findByOwnerId(CurrentUser.id());
    }

    public Customer findByIdOrThrow(String id) {
        return repository.findByIdAndOwnerId(id, CurrentUser.id()).orElseThrow(() -> ApiException.notFound("Not found"));
    }

    public Customer create(CustomerRequest request) {
        if (request.getId() == null || request.getId().isBlank()) {
            throw ApiException.badRequest("Record id is required");
        }
        if (repository.existsById(request.getId())) {
            throw ApiException.conflict("A record with this id already exists");
        }
        if (request.getName() == null || request.getName().isBlank()) {
            throw ApiException.badRequest("Customer name is required");
        }
        validate(request);
        Customer customer = new Customer(request.getId());
        apply(customer, request);
        if (customer.getCreatedAt() == null) {
            customer.setCreatedAt(LocalDate.now());
        }
        customer.setOwnerId(CurrentUser.id());
        return repository.save(customer);
    }

    public Customer update(String id, CustomerRequest request) {
        Customer customer = findByIdOrThrow(id);
        if (request.getName() != null && request.getName().isBlank()) {
            throw ApiException.badRequest("Customer name cannot be empty");
        }
        validate(request);
        apply(customer, request);
        return repository.save(customer);
    }

    public void delete(String id) {
        if (!repository.existsByIdAndOwnerId(id, CurrentUser.id())) {
            throw ApiException.notFound("Not found");
        }
        // Do not orphan invoices: the user must delete or move them first.
        if (invoiceRepository.existsByCustomer_Id(id)) {
            throw ApiException.conflict("Cannot delete a customer who still has invoices");
        }
        repository.deleteById(id);
    }

    /** Light checks that only run on the fields that were actually sent. */
    private void validate(CustomerRequest r) {
        if (r.getEmail() != null && !r.getEmail().isBlank() && !r.getEmail().contains("@")) {
            throw ApiException.unprocessable("Email address looks invalid");
        }
        if (r.getGstin() != null && !r.getGstin().isBlank()) {
            r.setGstin(r.getGstin().trim().toUpperCase());
            if (!GSTIN.matcher(r.getGstin()).matches()) {
                throw ApiException.unprocessable("GSTIN must be 15 characters, e.g. 33AABCA1234F1Z2");
            }
        }
    }

    private void apply(Customer customer, CustomerRequest r) {
        if (r.getName() != null) customer.setName(r.getName());
        if (r.getContactPerson() != null) customer.setContactPerson(r.getContactPerson());
        if (r.getEmail() != null) customer.setEmail(r.getEmail());
        if (r.getPhone() != null) customer.setPhone(r.getPhone());
        if (r.getCity() != null) customer.setCity(r.getCity());
        if (r.getGstin() != null) customer.setGstin(r.getGstin());
        if (r.getCreatedAt() != null) customer.setCreatedAt(r.getCreatedAt());
    }
}
