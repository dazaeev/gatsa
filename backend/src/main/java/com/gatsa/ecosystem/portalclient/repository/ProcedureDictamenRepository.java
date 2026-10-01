package com.gatsa.ecosystem.portalclient.repository;

import com.gatsa.ecosystem.portalclient.model.ProcedureDictamen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcedureDictamenRepository extends JpaRepository<ProcedureDictamen, Long> {
    List<ProcedureDictamen> findByLeadIdOrderByCreatedAtAsc(Long leadId);
}
