package com.paytrack.controller;

import com.paytrack.dto.DashboardResponse;
import com.paytrack.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    /** Totals, ageing buckets, monthly collections and top debtors in one call. */
    @GetMapping("/api/dashboard")
    public DashboardResponse dashboard() {
        return service.build();
    }
}
