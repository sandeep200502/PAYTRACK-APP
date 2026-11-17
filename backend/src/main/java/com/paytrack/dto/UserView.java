package com.paytrack.dto;

/** What the API shows about a user. The password hash is never included. */
public record UserView(Long id, String name, String email, String role) {
}
