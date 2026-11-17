package com.paytrack.service;

import com.paytrack.dto.AdminCreateUserRequest;
import com.paytrack.dto.AdminOverview;
import com.paytrack.dto.AuditEntry;
import com.paytrack.dto.AdminUserRow;
import com.paytrack.exception.ApiException;
import com.paytrack.model.AuditLog;
import com.paytrack.model.Settings;
import com.paytrack.model.User;
import com.paytrack.repository.AuditLogRepository;
import com.paytrack.repository.CustomerRepository;
import com.paytrack.repository.InvoiceRepository;
import com.paytrack.repository.PaymentRepository;
import com.paytrack.repository.ReminderRepository;
import com.paytrack.repository.SettingsRepository;
import com.paytrack.repository.UserRepository;
import com.paytrack.security.CurrentUser;
import com.paytrack.security.PasswordHasher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Administrator tools. Only reachable under /api/admin, which the AuthInterceptor
 * restricts to ADMIN accounts. The admin sees accounts and usage counts, never
 * the customers or invoices of other users.
 */
@Service
public class AdminService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ReminderRepository reminderRepository;
    private final SettingsRepository settingsRepository;
    private final AuditLogRepository auditRepository;
    private final PasswordHasher passwordHasher;

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    public AdminService(UserRepository userRepository, CustomerRepository customerRepository,
                        InvoiceRepository invoiceRepository, PaymentRepository paymentRepository,
                        ReminderRepository reminderRepository, SettingsRepository settingsRepository,
                        AuditLogRepository auditRepository, PasswordHasher passwordHasher) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.reminderRepository = reminderRepository;
        this.settingsRepository = settingsRepository;
        this.auditRepository = auditRepository;
        this.passwordHasher = passwordHasher;
    }

    public AdminOverview overview() {
        List<User> users = userRepository.findAll();
        long admins = users.stream().filter(u -> "ADMIN".equals(u.getRole())).count();
        long disabled = users.stream().filter(u -> !u.isActive()).count();
        BigDecimal collected = paymentRepository.findAll().stream()
                .map(p -> p.getAmount() == null ? BigDecimal.ZERO : p.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        LocalDate weekAgo = LocalDate.now().minusDays(7);
        long recent = users.stream().filter(u -> u.getCreatedAt() != null && !u.getCreatedAt().isBefore(weekAgo)).count();
        return new AdminOverview(users.size(), admins, disabled,
                customerRepository.count(), invoiceRepository.count(), paymentRepository.count(), collected, recent);
    }

    public List<AdminUserRow> listUsers() {
        return userRepository.findAll().stream().map(this::row).toList();
    }

    /** Disable or enable an account. */
    public AdminUserRow setActive(Long id, Boolean active) {
        if (active == null) {
            throw ApiException.badRequest("Send {\"active\": true} or {\"active\": false}");
        }
        User user = target(id);
        user.setActive(active);
        User saved = userRepository.save(user);
        log(active ? "ENABLE_USER" : "DISABLE_USER", saved);
        return row(saved);
    }

    /** The admin creates a normal account directly. */
    @Transactional
    public AdminUserRow createUser(AdminCreateUserRequest r) {
        String name = r.name() == null ? "" : r.name().trim();
        String email = r.email() == null ? "" : r.email().trim().toLowerCase();
        if (name.isEmpty()) {
            throw ApiException.badRequest("Name is required");
        }
        if (!EMAIL.matcher(email).matches()) {
            throw ApiException.unprocessable("Enter a valid email address");
        }
        checkPassword(r.password());
        if (userRepository.existsByEmail(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordHasher.hash(r.password()));
        user.setCreatedAt(LocalDate.now());
        user.setRole("USER");
        user.setActive(true);
        user = userRepository.save(user);
        Settings settings = new Settings();
        settings.setId(user.getId());
        settings.setOwnerName(name);
        settings.setEmail(email);
        settingsRepository.save(settings);
        log("CREATE_USER", user);
        return row(user);
    }

    /** Sets a temporary password for a user who forgot theirs. */
    public void resetPassword(Long id, String password) {
        User user = target(id);
        checkPassword(password);
        user.setPasswordHash(passwordHasher.hash(password));
        userRepository.save(user);
        log("RESET_PASSWORD", user);
    }

    /** The newest 50 admin actions, newest first. */
    public List<AuditEntry> activity() {
        return auditRepository.findTop50ByOrderByIdDesc().stream()
                .map(a -> new AuditEntry(a.getId(), a.getAt(), a.getAdmin(), a.getAction(), a.getTarget())).toList();
    }

    private void checkPassword(String password) {
        if (password == null || password.length() < 6) {
            throw ApiException.unprocessable("Password must be at least 6 characters");
        }
    }

    private void log(String action, User target) {
        String who = userRepository.findById(CurrentUser.id()).map(User::getEmail).orElse("admin");
        auditRepository.save(new AuditLog(LocalDateTime.now(), who, action, target.getName() + " <" + target.getEmail() + ">"));
    }

    /** Delete an account together with everything it owns. */
    @Transactional
    public void deleteUser(Long id) {
        User user = target(id);
        // Children first, because of the foreign keys: reminders, payments, invoices, customers.
        reminderRepository.deleteAll(reminderRepository.findByOwnerId(id));
        paymentRepository.deleteAll(paymentRepository.findByOwnerId(id));
        invoiceRepository.deleteAll(invoiceRepository.findByOwnerId(id));
        customerRepository.deleteAll(customerRepository.findByOwnerId(id));
        settingsRepository.deleteById(id);
        userRepository.delete(user);
        log("DELETE_USER", user);
    }

    /** The account an admin action is aimed at. Admins cannot act on themselves or on other admins. */
    private User target(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> ApiException.notFound("User not found"));
        if (user.getId().equals(CurrentUser.id())) {
            throw ApiException.unprocessable("You cannot change your own account here");
        }
        if ("ADMIN".equals(user.getRole())) {
            throw ApiException.unprocessable("Administrator accounts cannot be changed here");
        }
        return user;
    }

    private AdminUserRow row(User u) {
        return new AdminUserRow(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.isActive(), u.getCreatedAt(), u.getLastLoginAt(),
                customerRepository.countByOwnerId(u.getId()),
                invoiceRepository.countByOwnerId(u.getId()),
                paymentRepository.countByOwnerId(u.getId()));
    }
}
