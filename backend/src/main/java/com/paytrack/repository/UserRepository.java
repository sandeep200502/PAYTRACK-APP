package com.paytrack.repository;

import com.paytrack.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    /** Login and the "email already registered" check. Emails are stored in lower case. */
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
