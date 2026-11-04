package backend.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Standard RFC 7519 JSON Web Token (JWT) Utility with HS256 HMAC-SHA256 signature.
 * Operates without external maven dependencies, ensuring zero-configuration execution.
 */
public class JwtUtil {

    private static final String SECRET = "HeartCareAI_SuperSecretSecurityKey_Cardiovascular_CDSS_2026_SecureKey";
    private static final String HMAC_ALGO = "HmacSHA256";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final long EXPIRATION_SECONDS = 86400L; // 24 hours

    /**
     * Generates a signed RFC 7519 compliant JWT token (HS256).
     */
    public static String generateToken(String userId, String email, String name, String role) {
        try {
            long now = System.currentTimeMillis() / 1000L;
            long exp = now + EXPIRATION_SECONDS;

            // Header
            Map<String, Object> header = new LinkedHashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");
            String headerJson = OBJECT_MAPPER.writeValueAsString(header);
            String headerBase64 = base64UrlEncode(headerJson.getBytes(StandardCharsets.UTF_8));

            // Claims Payload
            Map<String, Object> claims = new LinkedHashMap<>();
            claims.put("sub", userId != null ? userId : "USR-UNKNOWN");
            claims.put("email", email != null ? email : "");
            claims.put("name", name != null ? name : "Clinician");
            claims.put("role", role != null ? role : "Cardiologist");
            claims.put("iss", "HeartCareAI");
            claims.put("iat", now);
            claims.put("exp", exp);

            String claimsJson = OBJECT_MAPPER.writeValueAsString(claims);
            String claimsBase64 = base64UrlEncode(claimsJson.getBytes(StandardCharsets.UTF_8));

            // Signature
            String signatureBase64 = sign(headerBase64 + "." + claimsBase64);

            return headerBase64 + "." + claimsBase64 + "." + signatureBase64;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate JWT token: " + e.getMessage(), e);
        }
    }

    /**
     * Validates signature and expiration timestamp of the given JWT token.
     */
    public static boolean validateToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        try {
            String[] parts = token.trim().split("\\.");
            if (parts.length != 3) {
                return false;
            }

            String content = parts[0] + "." + parts[1];
            String expectedSignature = sign(content);

            if (!MessageDigest.isEqual(
                    expectedSignature.getBytes(StandardCharsets.UTF_8),
                    parts[2].getBytes(StandardCharsets.UTF_8)
            )) {
                return false;
            }

            Map<String, Object> claims = extractClaims(token);
            if (claims == null) {
                return false;
            }

            Number expNumber = (Number) claims.get("exp");
            if (expNumber == null) {
                return false;
            }

            long now = System.currentTimeMillis() / 1000L;
            return expNumber.longValue() > now;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Extracts payload claims from the JWT.
     */
    public static Map<String, Object> extractClaims(String token) {
        try {
            String[] parts = token.trim().split("\\.");
            if (parts.length < 2) {
                return null;
            }
            byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
            String json = new String(decoded, StandardCharsets.UTF_8);
            return OBJECT_MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return null;
        }
    }

    public static String extractEmail(String token) {
        Map<String, Object> claims = extractClaims(token);
        return claims != null ? (String) claims.get("email") : null;
    }

    public static String extractUserId(String token) {
        Map<String, Object> claims = extractClaims(token);
        return claims != null ? (String) claims.get("sub") : null;
    }

    private static String sign(String data) throws Exception {
        Mac mac = Mac.getInstance(HMAC_ALGO);
        SecretKeySpec keySpec = new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), HMAC_ALGO);
        mac.init(keySpec);
        byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return base64UrlEncode(rawHmac);
    }

    private static String base64UrlEncode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}

