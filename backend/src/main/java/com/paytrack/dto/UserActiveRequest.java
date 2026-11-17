package com.paytrack.dto;

/** Body of PATCH /api/admin/users/{id}: {"active": false} disables the account. */
public record UserActiveRequest(Boolean active) {
}
