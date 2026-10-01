package com.gatsa.ecosystem.publicsite.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InsuranceQuoteRequest {
    @NotBlank(message = "El tipo de seguro es obligatorio")
    private String insuranceType; // VIDA, AUTOS, GASTOS_MEDICOS, PATRIMONIAL

    @NotNull(message = "La edad es obligatoria")
    @Min(value = 18, message = "Debe ser mayor de 18 años")
    private Integer age;

    @NotBlank(message = "El teléfono de contacto es obligatorio")
    private String phone;

    @NotBlank(message = "El nombre completo es obligatorio")
    private String fullName;

    private String email;
    private Double coverageAmount;
}
