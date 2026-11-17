package com.paytrack.repository;

import com.paytrack.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, String> {

    /** All invoices of one customer (traverses Invoice.customer.id). */
    List<Invoice> findByCustomer_Id(String customerId);

    /** Used to block deleting a customer that still has invoices. */
    boolean existsByCustomer_Id(String customerId);

    /** Keeps invoice numbers unique per user (the invoice itself is excluded). */
    boolean existsByOwnerIdAndNumberAndIdNot(Long ownerId, String number, String id);

    List<Invoice> findByOwnerId(Long ownerId);

    long countByOwnerId(Long ownerId);

    Optional<Invoice> findByIdAndOwnerId(String id, Long ownerId);

    boolean existsByIdAndOwnerId(String id, Long ownerId);
}
