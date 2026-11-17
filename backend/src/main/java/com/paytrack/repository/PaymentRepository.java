package com.paytrack.repository;

import com.paytrack.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, String> {

    // "Invoice_Id" (underscore) explicitly tells Spring Data to traverse the
    // invoice relation and match its id, since Payment has no real
    // "invoiceId" field (invoiceId is just a computed JSON getter).
    List<Payment> findByInvoice_Id(String invoiceId);

    List<Payment> findByOwnerId(Long ownerId);

    long countByOwnerId(Long ownerId);

    Optional<Payment> findByIdAndOwnerId(String id, Long ownerId);

    boolean existsByIdAndOwnerId(String id, Long ownerId);
}
