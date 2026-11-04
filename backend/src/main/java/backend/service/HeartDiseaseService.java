package backend.service;

import backend.dto.HeartDiseasePredictionRequest;
import backend.dto.MedicalReportResponse;
import backend.entity.PatientReport;
import backend.repository.PatientReportRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class HeartDiseaseService {

    @Autowired
    private PatientReportRepository repository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ml.service.url:http://localhost:5000/api/predict}")
    private String mlServiceUrl;

    public MedicalReportResponse predictAndGenerateReport(HeartDiseasePredictionRequest req) {
        MedicalReportResponse response;
        try {
            // Forward to Python ML Microservice
            ResponseEntity<String> rawRes = restTemplate.postForEntity(mlServiceUrl, req, String.class);
            response = objectMapper.readValue(rawRes.getBody(), MedicalReportResponse.class);
        } catch (Exception e) {
            // Fallback calculation if ML service is offline
            response = fallbackEvaluation(req);
        }

        // Persist to database if repository is configured
        try {
            PatientReport entity = PatientReport.builder()
                    .id(response.getReportId())
                    .patientName(req.getPatientName() != null ? req.getPatientName() : "Anonymous")
                    .dob(req.getDob())
                    .age(req.getAge())
                    .phone(req.getPhone())
                    .bloodGroup(req.getBloodGroup())
                    .sex(req.getSex())
                    .createdAt(response.getCreatedAt())
                    .riskScore(response.getPrediction().getRiskScore())
                    .riskLevel(response.getPrediction().getRiskLevel())
                    .reportDataJson(objectMapper.writeValueAsString(response))
                    .build();
            repository.save(entity);
        } catch (Exception ex) {
            // Log but don't fail response if database is transiently unavailable
            System.err.println("Warning: Could not save report to JPA repository: " + ex.getMessage());
        }

        return response;
    }

    public List<PatientReport> getReportHistory(String search) {
        try {
            if (search != null && !search.trim().isEmpty()) {
                return repository.findByPatientNameContainingIgnoreCaseOrPhoneContaining(search, search);
            }
            return repository.findAllByOrderByCreatedAtDesc();
        } catch (Exception e) {
            System.err.println("Warning: Unable to fetch report history from database: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    public Object getReportById(String id) {
        try {
            Optional<PatientReport> opt = repository.findById(id);
            if (opt.isPresent()) {
                PatientReport report = opt.get();
                if (report.getReportDataJson() != null && !report.getReportDataJson().isEmpty()) {
                    try {
                        return objectMapper.readValue(report.getReportDataJson(), Object.class);
                    } catch (Exception ignored) {}
                }
                return report;
            }
        } catch (Exception e) {
            System.err.println("Warning: Unable to query report by id: " + e.getMessage());
        }
        throw new IllegalArgumentException("Report not found for ID: " + id);
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        try {
            long total = repository.count();
            List<PatientReport> reports = repository.findAll();
            long highRisk = reports.stream().filter(r -> "High Risk".equalsIgnoreCase(r.getRiskLevel())).count();
            long moderateRisk = reports.stream().filter(r -> "Moderate Risk".equalsIgnoreCase(r.getRiskLevel())).count();
            long lowRisk = reports.stream().filter(r -> "Low Risk".equalsIgnoreCase(r.getRiskLevel())).count();
            double avgScore = reports.isEmpty() ? 0.0 :
                    Math.round((reports.stream().mapToDouble(r -> r.getRiskScore() != null ? r.getRiskScore() : 0.0).average().orElse(0.0)) * 10.0) / 10.0;

            stats.put("totalAssessments", total);
            stats.put("highRiskCount", highRisk);
            stats.put("moderateRiskCount", moderateRisk);
            stats.put("lowRiskCount", lowRisk);
            stats.put("normalCount", lowRisk);
            stats.put("avgRiskScore", avgScore);
        } catch (Exception e) {
            // Default baseline if database is starting up
            stats.put("totalAssessments", 0);
            stats.put("highRiskCount", 0);
            stats.put("moderateRiskCount", 0);
            stats.put("lowRiskCount", 0);
            stats.put("normalCount", 0);
            stats.put("avgRiskScore", 0.0);
        }
        return stats;
    }

    private MedicalReportResponse fallbackEvaluation(HeartDiseasePredictionRequest req) {
        double score = 5.0;
        if ("Yes".equalsIgnoreCase(req.getSmoking())) score += 15;
        if ("Yes".equalsIgnoreCase(req.getStroke())) score += 32;
        if ("Yes".equalsIgnoreCase(req.getDiabetic())) score += 20;
        if ("High".equalsIgnoreCase(req.getCholesterol())) score += 18;
        if ("Borderline High".equalsIgnoreCase(req.getCholesterol())) score += 8;
        if ("Male".equalsIgnoreCase(req.getSex())) score += 6;
        if ("Poor".equalsIgnoreCase(req.getGenHealth())) score += 20;
        if ("Fair".equalsIgnoreCase(req.getGenHealth())) score += 10;
        if (req.getBMI() != null && req.getBMI() >= 30) score += (req.getBMI() - 30) * 1.5;

        score = Math.min(Math.max(Math.round(score * 10.0) / 10.0, 1.2), 98.5);

        String level = score < 20 ? "Low Risk" : (score < 50 ? "Moderate Risk" : "High Risk");
        String badge = score < 20 ? "success" : (score < 50 ? "warning" : "danger");

        String reportId = "REP-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String createdAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        return MedicalReportResponse.builder()
                .reportId(reportId)
                .createdAt(createdAt)
                .patient(MedicalReportResponse.PatientSummary.builder()
                        .name(req.getPatientName())
                        .dob(req.getDob())
                        .age(req.getAge())
                        .phone(req.getPhone())
                        .bloodGroup(req.getBloodGroup())
                        .sex(req.getSex())
                        .build())
                .bmiDetails(MedicalReportResponse.BmiSummary.builder()
                        .bmi(req.getBMI())
                        .category(req.getBMI() < 25 ? "Normal" : (req.getBMI() < 30 ? "Overweight" : "Obese"))
                        .status("info")
                        .build())
                .prediction(MedicalReportResponse.PredictionSummary.builder()
                        .riskScore(score)
                        .riskLevel(level)
                        .riskBadge(badge)
                        .summary("Cardiovascular risk probability: " + score + "%.")
                        .build())
                .contributingFactors(Collections.emptyList())
                .recommendations(List.of(
                        "Schedule annual cardiac wellness screening.",
                        "Adhere to cardioprotective diet and 150 mins weekly aerobic activity."
                ))
                .build();
    }
}

