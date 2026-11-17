package com.paytrack.controller;

import com.paytrack.dto.SettingsRequest;
import com.paytrack.model.Settings;
import com.paytrack.service.SettingsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingsService service;

    public SettingsController(SettingsService service) {
        this.service = service;
    }

    @GetMapping
    public Settings get() {
        return service.get();
    }

    @PutMapping
    public Settings update(@RequestBody SettingsRequest request) {
        return service.update(request);
    }
}
