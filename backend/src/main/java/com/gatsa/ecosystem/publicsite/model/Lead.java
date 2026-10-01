package com.gatsa.ecosystem.publicsite.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "public_leads")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 15)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(nullable = false, length = 50)
    private String branch; // ORIZABA, HUATUSCO

    @Column(nullable = false, length = 50)
    private String serviceOfInterest; // RETIRO_DESEMPLEO_AFORE, MEJORAVIT, PROVEEDURIA_B2B

    @Column(length = 500)
    private String notes;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "NUEVO"; // NUEVO, CONTACTADO, EN_PROCESO, CONVERTIDO

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
