package backend.controller;

import backend.dto.HeartDiseasePredictionRequest;
import backend.dto.MedicalReportResponse;
import backend.entity.PatientReport;
import backend.service.HeartDiseaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<List<PatientReport>> getReports(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(service.getReportHistory(search));
    }
}

