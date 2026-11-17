package com.paytrack.controller;

import com.paytrack.dto.ReminderRequest;
import com.paytrack.model.Reminder;
import com.paytrack.service.ReminderService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    private final ReminderService service;

    public ReminderController(ReminderService service) {
        this.service = service;
    }

    @GetMapping
    public List<Reminder> all() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Reminder byId(@PathVariable String id) {
        return service.findByIdOrThrow(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Reminder create(@RequestBody ReminderRequest request) {
        return service.create(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}
