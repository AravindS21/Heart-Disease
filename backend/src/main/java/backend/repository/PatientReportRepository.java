package backend.repository;

import backend.entity.PatientReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PatientReportRepository extends JpaRepository<PatientReport, String> {
    List<PatientReport> findByPatientNameContainingIgnoreCaseOrPhoneContaining(String name, String phone);
    List<PatientReport> findAllByOrderByCreatedAtDesc();
}

