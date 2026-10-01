package com.gatsa.ecosystem.publicsite.repository;

import com.gatsa.ecosystem.publicsite.model.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByPhoneOrderByCreatedAtDesc(String phone);
    List<Lead> findByEmailOrderByCreatedAtDesc(String email);
    List<Lead> findByPhoneOrEmailOrderByCreatedAtDesc(String phone, String email);
}
