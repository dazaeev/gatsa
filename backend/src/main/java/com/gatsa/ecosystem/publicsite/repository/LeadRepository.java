package com.gatsa.ecosystem.publicsite.repository;

import com.gatsa.ecosystem.publicsite.model.Lead;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByPhoneOrderByCreatedAtDesc(String phone);
    List<Lead> findByEmailOrderByCreatedAtDesc(String email);
    List<Lead> findByPhoneOrEmailOrderByCreatedAtDesc(String phone, String email);

    Page<Lead> findByBranch(String branch, Pageable pageable);

    @Query("SELECT l FROM Lead l WHERE " +
           "(LOWER(l.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " l.phone LIKE CONCAT('%', :search, '%') OR " +
           " LOWER(l.serviceOfInterest) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(l.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " CAST(l.id AS string) LIKE CONCAT('%', :search, '%'))")
    Page<Lead> searchLeads(@Param("search") String search, Pageable pageable);

    @Query("SELECT l FROM Lead l WHERE l.branch = :branch AND " +
           "(LOWER(l.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " l.phone LIKE CONCAT('%', :search, '%') OR " +
           " LOWER(l.serviceOfInterest) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(l.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " CAST(l.id AS string) LIKE CONCAT('%', :search, '%'))")
    Page<Lead> searchLeadsByBranch(@Param("branch") String branch, @Param("search") String search, Pageable pageable);
}
