package com.paytrack.service;

import com.paytrack.model.Settings;
import com.paytrack.model.User;
import com.paytrack.repository.SettingsRepository;
import com.paytrack.repository.UserRepository;
import com.paytrack.security.PasswordHasher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Creates the one built in administrator account when the app starts, if it does not exist yet.
 * Nobody can register as the administrator: the email is already taken, and register always
 * makes normal users. The admin then creates nothing else by hand, users sign up themselves.
 */
@Component
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SettingsRepository settingsRepository;
    private final PasswordHasher passwordHasher;
    private final String email;
    private final String password;

    public AdminSeeder(UserRepository userRepository, SettingsRepository settingsRepository, PasswordHasher passwordHasher,
                       @Value("${paytrack.admin.email:admin@paytrack.in}") String email,
                       @Value("${paytrack.admin.password:Admin@123}") String password) {
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
        this.passwordHasher = passwordHasher;
        this.email = email.trim().toLowerCase();
        this.password = password;
    }

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmail(email)) {
            return;
        }
        User admin = new User();
        admin.setName("Administrator");
        admin.setEmail(email);
        admin.setPasswordHash(passwordHasher.hash(password));
        admin.setCreatedAt(LocalDate.now());
        admin.setRole("ADMIN");
        admin.setActive(true);
        admin = userRepository.save(admin);

        Settings settings = new Settings();
        settings.setId(admin.getId());
        settings.setOwnerName("Administrator");
        settings.setEmail(email);
        settingsRepository.save(settings);
    }
}
