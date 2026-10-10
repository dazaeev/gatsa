package com.gatsa.ecosystem.repository;

import com.gatsa.ecosystem.model.ImssConsultationLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImssConsultationLogRepository extends JpaRepository<ImssConsultationLog, Long> {

    List<ImssConsultationLog> findAllByOrderByCreatedAtDesc();

    List<ImssConsultationLog> findByBranchCodeOrderByCreatedAtDesc(String branchCode);

    @Query("SELECT l FROM ImssConsultationLog l WHERE " +
           "(:branchCode IS NULL OR :branchCode = 'ALL' OR LOWER(l.branchCode) = LOWER(:branchCode)) AND " +
           "(:search IS NULL OR :search = '' OR LOWER(l.curp) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(l.sid) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(l.userFullName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ImssConsultationLog> findFilteredLogs(@Param("branchCode") String branchCode,
                                               @Param("search") String search,
                                               Pageable pageable);
}
