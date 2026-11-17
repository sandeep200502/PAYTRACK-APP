package com.paytrack.service;

import com.paytrack.dto.SettingsRequest;
import com.paytrack.exception.ApiException;
import com.paytrack.model.Settings;
import com.paytrack.repository.SettingsRepository;
import com.paytrack.security.CurrentUser;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class SettingsService {

    private final SettingsRepository repository;

    public SettingsService(SettingsRepository repository) {
        this.repository = repository;
    }

    public Settings get() {
        Long userId = CurrentUser.id();
        return repository.findById(userId).orElseGet(() -> {
            Settings created = new Settings();
            created.setId(userId);
            return repository.save(created);
        });
    }

    public Settings update(SettingsRequest r) {
        if (r.getDefaultTaxRate() != null
                && (r.getDefaultTaxRate().signum() < 0 || r.getDefaultTaxRate().compareTo(BigDecimal.valueOf(100)) > 0)) {
            throw ApiException.unprocessable("Default tax rate must be between 0 and 100");
        }
        if (r.getDefaultDueDays() != null && r.getDefaultDueDays() < 0) {
            throw ApiException.unprocessable("Default due days cannot be negative");
        }
        Settings settings = get();
        if (r.getName() != null) settings.setName(r.getName());
        if (r.getOwnerName() != null) settings.setOwnerName(r.getOwnerName());
        if (r.getEmail() != null) settings.setEmail(r.getEmail());
        if (r.getPhone() != null) settings.setPhone(r.getPhone());
        if (r.getAddress() != null) settings.setAddress(r.getAddress());
        if (r.getGstin() != null) settings.setGstin(r.getGstin());
        if (r.getUpiId() != null) settings.setUpiId(r.getUpiId());
        if (r.getInvoicePrefix() != null) settings.setInvoicePrefix(r.getInvoicePrefix());
        if (r.getDefaultTaxRate() != null) settings.setDefaultTaxRate(r.getDefaultTaxRate());
        if (r.getDefaultDueDays() != null) settings.setDefaultDueDays(r.getDefaultDueDays());
        return repository.save(settings);
    }
}
