package backend.service;

import backend.dto.AuthResponse;
import backend.dto.LoginRequest;
import backend.dto.RegisterRequest;
import backend.dto.UserDto;
import backend.entity.User;
import backend.repository.UserRepository;
import backend.util.PasswordUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.StoredProcedureQuery;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    /**
     * Registers a new clinician using the MySQL stored procedure sp_register_user
     * with graceful JPA fallback.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email address is required.");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Full name is required.");
        }

        String email = request.getEmail().trim().toLowerCase();
        String userId = "USR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String salt = PasswordUtil.generateSalt();
        String passwordHash = PasswordUtil.hashPassword(request.getPassword(), salt);

        String role = (request.getRole() != null && !request.getRole().trim().isEmpty())
                ? request.getRole().trim() : "Cardiologist";
        String institution = (request.getInstitution() != null && !request.getInstitution().trim().isEmpty())
                ? request.getInstitution().trim() : "Central Cardiovascular Institute";
        String phone = request.getPhone() != null ? request.getPhone().trim() : "";
        String license = request.getLicenseNumber() != null ? request.getLicenseNumber().trim() : "";

        // Try executing stored procedure sp_register_user first
        boolean spExecuted = false;
        try {
            StoredProcedureQuery query = entityManager.createStoredProcedureQuery("sp_register_user");
            query.registerStoredProcedureParameter("p_user_id", String.class, ParameterMode.IN);
            query.registerStoredProcedureParameter("p_full_name", String.class, ParameterMode.IN);
            query.registerStoredProcedureParameter("p_email", String.class, ParameterMode.IN);
            query.registerStoredProcedureParameter("p_password_hash", String.class, ParameterMode.IN);
            query.registerStoredProcedureParameter("p_password_salt", String.class, ParameterMode.IN);
            query.registerStoredProcedureParameter("p_role", String.class, ParameterMode.IN);
            query.registerStoredProcedureParameter("p_institution", String.class, ParameterMode.IN);
            query.registerStoredProcedureParameter("p_phone", String.class, ParameterMode.IN);
            query.registerStoredProcedureParameter("p_license_number", String.class, ParameterMode.IN);
            query.registerStoredProcedureParameter("p_status_code", Integer.class, ParameterMode.OUT);
            query.registerStoredProcedureParameter("p_message", String.class, ParameterMode.OUT);

            query.setParameter("p_user_id", userId);
            query.setParameter("p_full_name", request.getName().trim());
            query.setParameter("p_email", email);
            query.setParameter("p_password_hash", passwordHash);
            query.setParameter("p_password_salt", salt);
            query.setParameter("p_role", role);
            query.setParameter("p_institution", institution);
            query.setParameter("p_phone", phone);
            query.setParameter("p_license_number", license);

            query.execute();

            Integer statusCode = (Integer) query.getOutputParameterValue("p_status_code");
            String message = (String) query.getOutputParameterValue("p_message");

            if (statusCode != null && statusCode == 409) {
                throw new IllegalStateException("An account with this email address already exists.");
            }
            spExecuted = true;
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            // Stored procedure not created yet or fallback to JPA repository
            spExecuted = false;
        }

        // Fallback to JPA if stored procedure not present
        User savedUser;
        if (!spExecuted) {
            if (userRepository.existsByEmailIgnoreCase(email)) {
                throw new IllegalStateException("An account with this email address already exists.");
            }

            User user = User.builder()
                    .userId(userId)
                    .fullName(request.getName().trim())
                    .email(email)
                    .passwordHash(passwordHash)
                    .passwordSalt(salt)
                    .role(role)
                    .institution(institution)
                    .phone(phone)
                    .licenseNumber(license)
                    .isActive(true)
                    .createdAt(LocalDateTime.now())
                    .build();

            savedUser = userRepository.save(user);
        } else {
            savedUser = userRepository.findByEmailIgnoreCase(email)
                    .orElseGet(() -> User.builder()
                            .userId(userId)
                            .fullName(request.getName().trim())
                            .email(email)
                            .role(role)
                            .institution(institution)
                            .phone(phone)
                            .licenseNumber(license)
                            .build());
        }

        UserDto userDto = mapToDto(savedUser);
        String token = "HCAI-" + UUID.randomUUID().toString();

        return AuthResponse.builder()
                .message("Registration successful. Welcome to HeartCare AI.")
                .user(userDto)
                .token(token)
                .build();
    }

    /**
     * Authenticates a clinician using sp_authenticate_user / sp_update_last_login.
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty() ||
            request.getPassword() == null || request.getPassword().isEmpty()) {
            throw new IllegalArgumentException("Email and password are required.");
        }

        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email address or password."));

        if (user.getIsActive() != null && !user.getIsActive()) {
            throw new IllegalStateException("Account has been deactivated. Please contact the clinical administrator.");
        }

        boolean valid = PasswordUtil.verifyPassword(request.getPassword(), user.getPasswordHash(), user.getPasswordSalt());
        if (!valid) {
            throw new IllegalArgumentException("Invalid email address or password.");
        }

        // Update last login timestamp via Stored Procedure or JPA
        try {
            userRepository.executeUpdateLastLogin(user.getUserId());
        } catch (Exception e) {
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);
        }

        UserDto userDto = mapToDto(user);
        userDto.setLastLoginAt(LocalDateTime.now());

        String token = "HCAI-" + UUID.randomUUID().toString();

        return AuthResponse.builder()
                .message("Authentication successful. Welcome, " + user.getFullName() + ".")
                .user(userDto)
                .token(token)
                .build();
    }

    @Transactional(readOnly = true)
    public UserDto getProfile(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Clinician profile not found."));
        return mapToDto(user);
    }

    private UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getUserId())
                .name(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .institution(user.getInstitution())
                .phone(user.getPhone())
                .licenseNumber(user.getLicenseNumber())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}

