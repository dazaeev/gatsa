package com.gatsa.ecosystem.repository;

import com.gatsa.ecosystem.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio Spring Data JPA optimizado para la entidad User.
 * Utiliza PreparedStatements por defecto previniendo Inyección SQL.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmail(String email);

    Boolean existsByPhone(String phone);

    Boolean existsByEmail(String email);
}
