package com.paytrack.controller;

import com.paytrack.dto.AuthResponse;
import com.paytrack.dto.LoginRequest;
import com.paytrack.dto.RegisterRequest;
import com.paytrack.dto.UserView;
import com.paytrack.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@RequestBody RegisterRequest request) {
        return service.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return service.login(request);
    }

    /** Who am I? Used by the frontend on page load to check the saved token is still valid. */
    @GetMapping("/me")
    public UserView me() {
        return service.me();
    }
}
