package com.paytrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Starts the application. Sample data is no longer created at startup: with login,
 * every user loads their own demo data (POST /api/system/reset) after they register.
 */
@SpringBootApplication
public class PaytrackApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaytrackApiApplication.class, args);
    }
}
