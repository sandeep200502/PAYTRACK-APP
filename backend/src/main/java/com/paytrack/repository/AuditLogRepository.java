package com.paytrack.repository;

import com.paytrack.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    /** The 50 newest lines, newest first. */
    List<AuditLog> findTop50ByOrderByIdDesc();
}
