package com.gatsa.ecosystem.publicsite.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class LeadCaptureRequest {
    @NotBlank(message = "El nombre completo es obligatorio")
    private String fullName;

    @NotBlank(message = "El teléfono celular a 10 dígitos es obligatorio")
    @Pattern(regexp = "^\\d{10}$", message = "El teléfono debe contener 10 dígitos numéricos")
    private String phone;

    private String email;

    @NotBlank(message = "La sucursal de preferencia es obligatoria")
    private String branch; // ORIZABA, HUATUSCO

    @NotBlank(message = "El servicio de interés es obligatorio")
    private String serviceOfInterest;

    private String notes;
}
