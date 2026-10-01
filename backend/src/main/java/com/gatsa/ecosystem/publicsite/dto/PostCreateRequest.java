package com.gatsa.ecosystem.publicsite.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PostCreateRequest {
    @NotBlank(message = "El título de la publicación es obligatorio")
    private String title;

    @NotBlank(message = "La categoría es obligatoria")
    private String category;

    @NotBlank(message = "El contenido es obligatorio")
    private String content;

    private String imageBase64;
    private String imageUrl;
}
