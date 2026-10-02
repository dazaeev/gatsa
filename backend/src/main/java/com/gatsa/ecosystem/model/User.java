package com.gatsa.ecosystem.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Entidad JPA User que representa a los usuarios del Ecosistema Digital GATSA.
 * Soporta auditoría automática con @CreatedDate y @LastModifiedDate.
 * Las tablas se crearán automáticamente al arrancar la aplicación gracias a spring.jpa.hibernate.ddl-auto=update.
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_phone", columnList = "phone", unique = true),
    @Index(name = "idx_user_email", columnList = "email", unique = true)
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 15)
    private String phone; // Teléfono/Usuario principal para acceso corporativo

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password; // Contraseña cifrada con BCrypt

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 50)
    private String role; // ROLE_SUPER_ADMIN, ROLE_GERENTE_SUCURSAL, ROLE_AGENTE_COMPLETO, ROLE_OPERADOR_IMSS, ROLE_CLIENT, ROLE_PARTNER

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    // Campos de auditoría corporativa
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
