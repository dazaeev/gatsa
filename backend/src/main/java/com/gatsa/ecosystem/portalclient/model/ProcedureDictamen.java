package com.gatsa.ecosystem.portalclient.model;

import com.gatsa.ecosystem.publicsite.model.Lead;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "procedure_dictamens")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcedureDictamen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;

    @Column(nullable = false)
    private Integer stepNumber; // Paso 1, 2, 3, 4, 5

    @Column(nullable = false, length = 50)
    private String status;

    @Column(length = 1000)
    private String adminNote;

    @Column(length = 255)
    private String attachmentFileName;

    @Column(length = 255)
    private String attachmentStoredName;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
