package com.gatsa.ecosystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entidad que representa las Sucursales de Grupo GATSA creadas dinámicamente por Super Admins.
 */
@Entity
@Table(name = "branches", indexes = {
    @Index(name = "idx_branch_code", columnList = "code", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code; // Ej: ORIZABA_BARRIO_NUEVO, CORDOBA_CENTRO

    @Column(nullable = false, length = 150)
    private String name; // Ej: Sucursal Barrio Nuevo - Orizaba

    @Column(length = 255)
    private String address;

    @Column(length = 20)
    private String phone;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
