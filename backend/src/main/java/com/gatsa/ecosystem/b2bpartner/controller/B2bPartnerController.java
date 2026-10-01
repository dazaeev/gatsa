package com.gatsa.ecosystem.b2bpartner.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/b2bpartner")
public class B2bPartnerController {

    @GetMapping("/wallet")
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getWalletBalance() {
        return ResponseEntity.ok(Map.of(
                "partnerName", "Papelería y Novedades Orizaba",
                "availableBalance", 4850.00,
                "creditLimit", 10000.00,
                "issuedFoliosCount", 142,
                "recentTransactions", List.of(
                        Map.of("id", "TX-1002", "concept", "Emisión Acta de Nacimiento", "amount", -75.00, "date", "2026-09-29 10:30"),
                        Map.of("id", "TX-1001", "concept", "Recarga de Saldo Prepago", "amount", 2000.00, "date", "2026-09-28 14:15")
                )
        ));
    }
}
