package com.paytrack.repository;

import com.paytrack.model.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReminderRepository extends JpaRepository<Reminder, String> {

    List<Reminder> findByInvoice_Id(String invoiceId);

    List<Reminder> findByOwnerId(Long ownerId);

    long countByOwnerId(Long ownerId);

    Optional<Reminder> findByIdAndOwnerId(String id, Long ownerId);

    boolean existsByIdAndOwnerId(String id, Long ownerId);
}
