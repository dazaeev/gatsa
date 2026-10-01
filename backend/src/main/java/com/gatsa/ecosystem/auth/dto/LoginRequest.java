package com.gatsa.ecosystem.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "El teléfono o correo electrónico es obligatorio")
    @JsonAlias({"phone", "email"})
    private String username; // Acepta "username", "phone" o "email" desde JSON

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;
}
