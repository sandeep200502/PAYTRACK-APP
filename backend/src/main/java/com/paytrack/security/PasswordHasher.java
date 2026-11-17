package com.paytrack.security;

import org.springframework.stereotype.Component;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Turns a password into a one-way hash (PBKDF2 with HMAC-SHA256, built into Java).
 * A random salt is added, so two users with the same password get different hashes,
 * and 120,000 repetitions make guessing passwords slow for an attacker.
 * Stored format: pbkdf2$120000$<salt>$<hash>
 */
@Component
public class PasswordHasher {

    private static final int ITERATIONS = 120_000;
    private static final int KEY_BITS = 256;
    private static final SecureRandom RANDOM = new SecureRandom();

    public String hash(String password) {
        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);
        byte[] hash = derive(password, salt, ITERATIONS);
        return "pbkdf2$" + ITERATIONS + "$" + b64(salt) + "$" + b64(hash);
    }

    /** Hashes the typed password with the stored salt and compares in constant time. */
    public boolean matches(String password, String stored) {
        try {
            String[] parts = stored.split("\\$");
            if (parts.length != 4 || !parts[0].equals("pbkdf2")) {
                return false;
            }
            int iterations = Integer.parseInt(parts[1]);
            byte[] salt = Base64.getDecoder().decode(parts[2]);
            byte[] expected = Base64.getDecoder().decode(parts[3]);
            return MessageDigest.isEqual(expected, derive(password, salt, iterations));
        } catch (RuntimeException e) {
            return false;
        }
    }

    private static byte[] derive(String password, byte[] salt, int iterations) {
        try {
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, iterations, KEY_BITS);
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Password hashing is not available", e);
        }
    }

    private static String b64(byte[] bytes) {
        return Base64.getEncoder().encodeToString(bytes);
    }
}
