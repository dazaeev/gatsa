package com.gatsa.ecosystem.admin.controller;

import com.gatsa.ecosystem.model.Branch;
import com.gatsa.ecosystem.repository.BranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/branches")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class BranchController {

    @Autowired
    private BranchRepository branchRepository;

    @GetMapping
    public ResponseEntity<List<Branch>> getAllBranches() {
        return ResponseEntity.ok(branchRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createBranch(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String code = body.get("code");
        String address = body.get("address");
        String phone = body.get("phone");

        if (name == null || name.isBlank() || code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "El nombre y código de sucursal son obligatorios."));
        }

        String cleanCode = code.trim().toUpperCase().replaceAll("\\s+", "_");

        if (branchRepository.existsByCode(cleanCode)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Ya existe una sucursal con el código: " + cleanCode));
        }

        Branch branch = Branch.builder()
                .code(cleanCode)
                .name(name.trim())
                .address(address != null ? address.trim() : "")
                .phone(phone != null ? phone.trim() : "")
                .active(true)
                .build();

        branchRepository.save(branch);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "¡Sucursal '" + branch.getName() + "' creada exitosamente por el Super Admin!",
                "branch", branch
        ));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<Map<String, Object>> toggleBranchStatus(@PathVariable Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada con ID: " + id));

        branch.setActive(!branch.getActive());
        branchRepository.save(branch);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Estatus de la sucursal actualizado a: " + (branch.getActive() ? "ACTIVA" : "INACTIVA"),
                "active", branch.getActive()
        ));
    }
}
