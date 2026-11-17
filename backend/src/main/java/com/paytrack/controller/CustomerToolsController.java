package com.paytrack.controller;

import com.paytrack.dto.CustomerStatement;
import com.paytrack.service.StatementService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
public class CustomerToolsController {

    private final StatementService statementService;

    public CustomerToolsController(StatementService statementService) {
        this.statementService = statementService;
    }

    @GetMapping("/{id}/statement")
    public CustomerStatement statement(@PathVariable String id) {
        return statementService.build(id);
    }
}
