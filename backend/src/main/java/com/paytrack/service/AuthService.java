package com.paytrack.service;

import com.paytrack.dto.AuthResponse;
import com.paytrack.dto.LoginRequest;
import com.paytrack.dto.RegisterRequest;
import com.paytrack.dto.UserView;
import com.paytrack.exception.ApiException;
import com.paytrack.model.Settings;
import com.paytrack.model.User;
import com.paytrack.repository.SettingsRepository;
import com.paytrack.repository.UserRepository;
import com.paytrack.security.CurrentUser;
import com.paytrack.security.JwtService;
import com.paytrack.security.PasswordHasher;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final UserRepository userRepository;
    private final SettingsRepository settingsRepository;
    private final PasswordHasher passwordHasher;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, SettingsRepository settingsRepository,
                       PasswordHasher passwordHasher, JwtService jwtService) {
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
        this.passwordHasher = passwordHasher;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest r) {
        String name = r.name() == null ? "" : r.name().trim();
        String email = normalise(r.email());
        if (name.isEmpty()) {
            throw ApiException.badRequest("Name is required");
        }
        if (!EMAIL.matcher(email).matches()) {
            throw ApiException.unprocessable("Enter a valid email address");
        }
        if (r.password() == null || r.password().length() < 6) {
            throw ApiException.unprocessable("Password must be at least 6 characters");
        }
        if (userRepository.existsByEmail(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordHasher.hash(r.password()));
        user.setCreatedAt(LocalDate.now());
        // Registration only ever creates normal users. The administrator is created at startup (AdminSeeder).
        user.setRole("USER");
        user.setActive(true);
        user = userRepository.save(user);

        // Every user gets their own business-profile row; its id is the user's id.
        Settings settings = new Settings();
        settings.setId(user.getId());
        settings.setOwnerName(name);
        settings.setEmail(email);
        settingsRepository.save(settings);

        return respond(user);
    }

    public AuthResponse login(LoginRequest r) {
        User user = userRepository.findByEmail(normalise(r.email())).orElse(null);
        // Same message for "no such email" and "wrong password", so the API does not reveal which emails exist.
        if (user == null || r.password() == null || !passwordHasher.matches(r.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Incorrect email or password");
        }
        if (!user.isActive()) {
            throw ApiException.forbidden("This account has been disabled");
        }
        user.setLastLoginAt(java.time.LocalDateTime.now());
        userRepository.save(user);
        return respond(user);
    }

    public UserView me() {
        User user = userRepository.findById(CurrentUser.id())
                .orElseThrow(() -> ApiException.unauthorized("This account no longer exists"));
        return view(user);
    }

    private AuthResponse respond(User user) {
        return new AuthResponse(jwtService.create(user.getId()), view(user));
    }

    private static UserView view(User user) {
        return new UserView(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    private static String normalise(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
