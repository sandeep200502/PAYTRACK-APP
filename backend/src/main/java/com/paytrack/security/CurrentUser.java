package com.paytrack.security;

import com.paytrack.exception.ApiException;

/**
 * Remembers WHO is making the current request. The AuthInterceptor sets it after
 * checking the token, services read it to filter data, and it is cleared when the
 * request ends. A ThreadLocal is used because each request runs on its own thread.
 */
public final class CurrentUser {

    private static final ThreadLocal<Long> HOLDER = new ThreadLocal<>();
    private static final ThreadLocal<String> ROLE = new ThreadLocal<>();

    private CurrentUser() {
    }

    public static void set(Long userId, String role) {
        HOLDER.set(userId);
        ROLE.set(role);
    }

    public static void clear() {
        HOLDER.remove();
        ROLE.remove();
    }

    /** True when the logged-in user is an administrator. */
    public static boolean isAdmin() {
        return "ADMIN".equals(ROLE.get());
    }

    /** The logged-in user's id. Throws 401 if called outside an authenticated request. */
    public static Long id() {
        Long id = HOLDER.get();
        if (id == null) {
            throw ApiException.unauthorized("Please log in");
        }
        return id;
    }
}
