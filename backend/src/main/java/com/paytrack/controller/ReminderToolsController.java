package com.paytrack.controller;

import com.paytrack.dto.ReminderSuggestion;
import com.paytrack.service.ReminderMessageService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reminders")
public class ReminderToolsController {

    private final ReminderMessageService service;

    public ReminderToolsController(ReminderMessageService service) {
        this.service = service;
    }

    /** Overdue invoices that need chasing, with the recommended tone and channel. */
    @GetMapping("/suggestions")
    public List<ReminderSuggestion> suggestions() {
        return service.suggestions();
    }
}
