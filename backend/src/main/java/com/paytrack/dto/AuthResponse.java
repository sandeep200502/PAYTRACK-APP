package com.paytrack.dto;

/** Returned by register and login: the token to send on every later request, plus the user. */
public record AuthResponse(String token, UserView user) {
}
