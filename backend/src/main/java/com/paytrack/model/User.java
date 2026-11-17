package com.paytrack.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** A registered account. Every customer, invoice, payment and reminder belongs to exactly one user. */
@Entity
@Table(name = "users") // "user" is a reserved word in H2, so the table is called users
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    /** Never the real password: "pbkdf2$iterations$salt$hash" (see PasswordHasher). */
    @Column(nullable = false, length = 300)
    private String passwordHash;

    private LocalDate createdAt;

    /** "USER" for normal accounts, "ADMIN" for administrators. */
    @Column(length = 10)
    private String role = "USER";

    /** A disabled account cannot log in and its existing tokens stop working. */
    private Boolean active = true;

    /** Set on every successful login; null if the person never logged in. */
    private LocalDateTime lastLoginAt;

    public User() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getRole() { return role == null ? "USER" : role; }
    public void setRole(String role) { this.role = role; }
    public boolean isActive() { return active == null || active; }
    public void setActive(Boolean active) { this.active = active; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    public LocalDate getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }
}
