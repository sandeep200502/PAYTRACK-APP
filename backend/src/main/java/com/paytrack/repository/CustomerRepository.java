package com.paytrack.repository;

import com.paytrack.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, String> {

    List<Customer> findByOwnerId(Long ownerId);

    long countByOwnerId(Long ownerId);

    Optional<Customer> findByIdAndOwnerId(String id, Long ownerId);

    boolean existsByIdAndOwnerId(String id, Long ownerId);
}
