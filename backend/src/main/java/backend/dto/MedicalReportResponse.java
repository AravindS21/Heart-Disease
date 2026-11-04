package backend.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalReportResponse {
    private String reportId;
    private String createdAt;
    private PatientSummary patient;
    private Map<String, Object> clinicalInputs;
    private BmiSummary bmiDetails;
    private PredictionSummary prediction;
    private List<ContributingFactor> contributingFactors;
    private List<String> recommendations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PatientSummary {
        private String name;
        private String dob;
        private Integer age;
        private String phone;
        private String bloodGroup;
        private String sex;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BmiSummary {
        private Double bmi;
        private String category;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PredictionSummary {
        private Double riskScore;
        private String riskLevel;
        private String riskBadge;
        private String summary;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContributingFactor {
        private String name;
        private String value;
        private String severity;
        private String description;
    }
}

