package com.paytrack.dto;

/** Body of POST /api/admin/users/{id}/password: the temporary password to set. */
public record PasswordResetRequest(String password) {
}
