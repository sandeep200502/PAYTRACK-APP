package com.paytrack.security;

import com.paytrack.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Creates and checks login tokens in the standard JWT format: header.payload.signature.
 * The signature is HMAC-SHA256 over "header.payload" with a secret only the server knows,
 * so nobody can change the user id inside a token without the server noticing.
 */
@Service
public class JwtService {

    private static final String HEADER = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
    private static final Pattern SUB = Pattern.compile("\"sub\":(\\d+)");
    private static final Pattern EXP = Pattern.compile("\"exp\":(\\d+)");

    private final byte[] secret;
    private final long validSeconds;

    public JwtService(@Value("${paytrack.jwt.secret}") String secret,
                      @Value("${paytrack.jwt.hours:24}") long hours) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.validSeconds = hours * 3600;
    }

    public String create(Long userId) {
        long expires = Instant.now().getEpochSecond() + validSeconds;
        String payload = "{\"sub\":" + userId + ",\"exp\":" + expires + "}";
        String unsigned = encode(HEADER) + "." + encode(payload);
        return unsigned + "." + sign(unsigned);
    }

    /** Returns the user id inside a valid, unexpired token, otherwise throws 401. */
    public Long verify(String token) {
        String[] parts = token == null ? new String[0] : token.split("\\.");
        if (parts.length != 3) {
            throw ApiException.unauthorized("Invalid login token");
        }
        String expected = sign(parts[0] + "." + parts[1]);
        if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8))) {
            throw ApiException.unauthorized("Invalid login token");
        }
        String payload;
        try {
            payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw ApiException.unauthorized("Invalid login token");
        }
        Matcher sub = SUB.matcher(payload);
        Matcher exp = EXP.matcher(payload);
        if (!sub.find() || !exp.find()) {
            throw ApiException.unauthorized("Invalid login token");
        }
        if (Long.parseLong(exp.group(1)) < Instant.now().getEpochSecond()) {
            throw ApiException.unauthorized("Your session has expired, please log in again");
        }
        return Long.parseLong(sub.group(1));
    }

    private String sign(String text) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(text.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Token signing is not available", e);
        }
    }

    private static String encode(String text) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(text.getBytes(StandardCharsets.UTF_8));
    }
}
