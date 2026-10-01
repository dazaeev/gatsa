package com.gatsa.ecosystem.b2bpartner.repository;

import com.gatsa.ecosystem.b2bpartner.model.PartnerWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PartnerWalletRepository extends JpaRepository<PartnerWallet, Long> {
    Optional<PartnerWallet> findByPartnerId(Long partnerId);
}
