package com.paytrack.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** One line of the administrator activity log: who did what, to whom, and when. */
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime at;
    private String admin;
    /** CREATE_USER, DISABLE_USER, ENABLE_USER, RESET_PASSWORD or DELETE_USER */
    private String action;
    /** Name and email as text, so the line still makes sense after the account is deleted. */
    private String target;

    public AuditLog() {
    }

    public AuditLog(LocalDateTime at, String admin, String action, String target) {
        this.at = at;
        this.admin = admin;
        this.action = action;
        this.target = target;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getAt() { return at; }
    public String getAdmin() { return admin; }
    public String getAction() { return action; }
    public String getTarget() { return target; }
}
