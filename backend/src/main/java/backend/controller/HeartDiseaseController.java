package backend.controller;

import backend.dto.HeartDiseasePredictionRequest;
import backend.dto.MedicalReportResponse;
import backend.entity.PatientReport;
import backend.service.HeartDiseaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class HeartDiseaseController {

    @Autowired
    private HeartDiseaseService service;

    @PostMapping("/predict")
    public ResponseEntity<MedicalReportResponse> predict(@RequestBody HeartDiseasePredictionRequest request) {
        MedicalReportResponse report = service.predictAndGenerateReport(request);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getReports(@RequestParam(required = false) String search) {
        List<PatientReport> list = service.getReportHistory(search);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("reports", list);
        response.put("count", list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports/{id}")
    public ResponseEntity<?> getReportById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(service.getReportById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(service.getDashboardStats());
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("status", "UP");
        status.put("service", "HeartCare AI Spring Boot CDSS Gateway");
        status.put("database", "MySQL (heart_disease_db)");
        status.put("mlMicroservice", "http://localhost:5000");
        return ResponseEntity.ok(status);
    }
}

