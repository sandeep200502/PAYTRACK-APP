package com.paytrack.dto;

/** Body of POST /api/admin/users: the admin creates a normal account. */
public record AdminCreateUserRequest(String name, String email, String password) {
}
