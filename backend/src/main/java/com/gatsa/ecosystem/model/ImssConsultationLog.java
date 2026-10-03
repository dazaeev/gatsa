package com.gatsa.ecosystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entidad de Auditoría e Historial de Consultas de Semanas Cotizadas del IMSS.
 * Registra qué empleado consultó cada CURP, la fecha, sucursal y el PDF generado.
 */
@Entity
@Table(name = "imss_consultation_logs", indexes = {
    @Index(name = "idx_imss_curp", columnList = "curp"),
    @Index(name = "idx_imss_branch", columnList = "branch_code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImssConsultationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 18)
    private String curp;

    @Column(length = 50)
    private String sid;

    @Column(name = "pdf_file_name", length = 255)
    private String pdfFileName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // Empleado que realizó la consulta

    @Column(name = "user_full_name", length = 150)
    private String userFullName;

    @Column(name = "user_role", length = 50)
    private String userRole;

    @Column(name = "branch_code", length = 50)
    private String branchCode; // Sucursal desde donde se operó

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
