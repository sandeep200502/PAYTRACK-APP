package com.paytrack.controller;

import com.paytrack.dto.AdminCreateUserRequest;
import com.paytrack.dto.AdminOverview;
import com.paytrack.dto.AuditEntry;
import com.paytrack.dto.PasswordResetRequest;
import com.paytrack.dto.AdminUserRow;
import com.paytrack.dto.UserActiveRequest;
import com.paytrack.service.AdminService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Administrator endpoints. The AuthInterceptor answers 403 to anyone who is not an admin. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService service;

    public AdminController(AdminService service) {
        this.service = service;
    }

    @GetMapping("/overview")
    public AdminOverview overview() {
        return service.overview();
    }

    @GetMapping("/users")
    public List<AdminUserRow> users() {
        return service.listUsers();
    }

    @PatchMapping("/users/{id}")
    public AdminUserRow setActive(@PathVariable Long id, @RequestBody UserActiveRequest request) {
        return service.setActive(id, request.active());
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.deleteUser(id);
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUserRow create(@RequestBody AdminCreateUserRequest request) {
        return service.createUser(request);
    }

    @PostMapping("/users/{id}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@PathVariable Long id, @RequestBody PasswordResetRequest request) {
        service.resetPassword(id, request.password());
    }

    @GetMapping("/activity")
    public List<AuditEntry> activity() {
        return service.activity();
    }
}
