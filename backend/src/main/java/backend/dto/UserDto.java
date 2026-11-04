package backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private String id;
    private String name;
    private String email;
    private String role;
    private String institution;
    private String phone;
    private String licenseNumber;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
}

