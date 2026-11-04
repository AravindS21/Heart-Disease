package backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Table(name = "patient_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientReport {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false)
    private String patientName;

    private String dob;
    private Integer age;
    private String phone;
    private String bloodGroup;
    private String sex;

    @Column(nullable = false)
    private String createdAt;

    private Double riskScore;
    private String riskLevel;

    @Column(columnDefinition = "TEXT")
    private String reportDataJson;
}

