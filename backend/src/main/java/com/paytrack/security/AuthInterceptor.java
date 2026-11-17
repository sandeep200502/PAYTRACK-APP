package com.paytrack.security;

import com.paytrack.exception.ApiException;
import com.paytrack.model.User;
import com.paytrack.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Runs before every /api request (see AuthConfig). It reads the token from
 * "Authorization: Bearer ...", checks it, and remembers the user in CurrentUser.
 * Print pages and CSV downloads open in a new browser tab, which cannot send a
 * header, so those links may carry the token as ?access_token=... instead.
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public AuthInterceptor(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        CurrentUser.clear();
        // Browser pre-flight (CORS) requests carry no token by design.
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }
        String token = null;
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7).trim();
        } else if (request.getParameter("access_token") != null) {
            token = request.getParameter("access_token");
        }
        if (token == null || token.isBlank()) {
            throw ApiException.unauthorized("Please log in");
        }
        Long userId = jwtService.verify(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("This account no longer exists"));
        if (!user.isActive()) {
            throw ApiException.forbidden("This account has been disabled");
        }
        // Everything under /api/admin is for administrators only.
        if (request.getRequestURI().startsWith("/api/admin") && !"ADMIN".equals(user.getRole())) {
            throw ApiException.forbidden("Administrator access only");
        }
        CurrentUser.set(userId, user.getRole());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        CurrentUser.clear();
    }
}
