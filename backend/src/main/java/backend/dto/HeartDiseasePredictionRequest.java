package backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HeartDiseasePredictionRequest {
    // Patient Demographics
    private String patientName;
    private String dob;
    private Integer age;
    private String phone;
    private String bloodGroup;

    // Active Clinical Inputs
    private Double BMI;
    private String cholesterol; // 'Normal', 'Borderline High', 'High'
    private Integer sleepTime;
    private String smoking;
    private String alcoholDrinking;
    private String stroke;
    private String sex;
    private String ageCategory;
    private String diabetic;
    private String genHealth;
    private String asthma;
}
