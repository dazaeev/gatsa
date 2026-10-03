package com.gatsa.ecosystem.repository;

import com.gatsa.ecosystem.model.ImssConsultationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImssConsultationLogRepository extends JpaRepository<ImssConsultationLog, Long> {
    List<ImssConsultationLog> findByBranchCodeOrderByCreatedAtDesc(String branchCode);
    List<ImssConsultationLog> findAllByOrderByCreatedAtDesc();
}
