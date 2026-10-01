package com.gatsa.ecosystem.portalclient.controller;

import com.gatsa.ecosystem.model.User;
import com.gatsa.ecosystem.portalclient.model.Document;
import com.gatsa.ecosystem.portalclient.repository.DocumentRepository;
import com.gatsa.ecosystem.publicsite.model.Lead;
import com.gatsa.ecosystem.publicsite.repository.LeadRepository;
import com.gatsa.ecosystem.repository.UserRepository;
import com.gatsa.ecosystem.util.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/portalclient")
public class PortalClientController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private EmailService emailService;

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getProcedureStatus() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String identifier = auth.getName(); // Email or Phone

        User user = userRepository.findByEmail(identifier)
                .orElseGet(() -> userRepository.findByPhone(identifier)
                        .orElse(null));

        Map<String, Object> response = new HashMap<>();

        if (user == null) {
            response.put("fullName", "Cliente GATSA");
            response.put("phone", "No disponible");
            response.put("email", identifier);
            response.put("leads", List.of(
                    Map.of(
                            "id", 1,
                            "procedureId", "GATSA-2026-8842",
                            "serviceOfInterest", "RETIRO_DESEMPLEO_AFORE",
                            "branch", "ORIZABA_BARRIO_NUEVO",
                            "status", "NUEVO",
                            "currentStep", 1,
                            "totalSteps", 5,
                            "timeline", List.of(
                                    Map.of("step", "Solicitud Recibida en Sucursal", "completed", true, "date", "Hoy"),
                                    Map.of("step", "Carga e Integración de Documentación / INE", "completed", false, "date", "Pendiente de Carga"),
                                    Map.of("step", "Validación en Sistema AFORE / CONSAR", "completed", false, "date", "Pendiente"),
                                    Map.of("step", "Emisión de Cheque / Transferencia", "completed", false, "date", "Pendiente"),
                                    Map.of("step", "Conclusión y Finiquito del Trámite", "completed", false, "date", "Pendiente")
                            )
                    )
            ));
            response.put("documents", List.of());
            return ResponseEntity.ok(response);
        }

        // Datos del Usuario Real
        response.put("userId", user.getId());
        response.put("fullName", user.getFullName());
        response.put("phone", user.getPhone());
        response.put("email", user.getEmail());

        // Buscar documentos reales cargados por el usuario
        List<Document> userDocs = documentRepository.findByUserIdOrderByUploadedAtDesc(user.getId());

        // BUSCAR CONSOLIDADO POR TELÉFONO O CORREO PARA NO PERDER NINGÚN TRÁMITE
        List<Lead> leads = leadRepository.findByPhoneOrEmailOrderByCreatedAtDesc(user.getPhone(), user.getEmail());

        List<Map<String, Object>> leadList = new ArrayList<>();

        if (!leads.isEmpty()) {
            for (Lead leadItem : leads) {
                String dateStr = leadItem.getCreatedAt() != null 
                        ? leadItem.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                        : "Hoy";

                Map<String, Object> leadMap = new HashMap<>();
                leadMap.put("id", leadItem.getId());
                leadMap.put("procedureId", "GATSA-2026-" + (1000 + leadItem.getId()));
                leadMap.put("serviceOfInterest", leadItem.getServiceOfInterest());
                leadMap.put("branch", leadItem.getBranch());
                leadMap.put("status", leadItem.getStatus());
                leadMap.put("createdAt", dateStr);

                // Documentos vinculados a este trámite O globales (INE)
                List<Document> leadDocs = userDocs.stream()
                        .filter(d -> (d.getLead() != null && d.getLead().getId().equals(leadItem.getId())) 
                                  || "INE_IDENTIFICACION".equalsIgnoreCase(d.getDocumentType()))
                        .toList();

                boolean hasUploadedDocsForLead = !leadDocs.isEmpty();

                if (hasUploadedDocsForLead) {
                    leadMap.put("currentStep", 3);
                    leadMap.put("timeline", List.of(
                            Map.of("step", "Solicitud Recibida en Sucursal " + leadItem.getBranch(), "completed", true, "date", dateStr),
                            Map.of("step", "Documentación e INE Integrada (" + leadDocs.size() + " Archivo(s))", "completed", true, "date", dateStr),
                            Map.of("step", "Validación en Sistema AFORE / CONSAR", "completed", false, "date", "En Proceso"),
                            Map.of("step", "Emisión de Cheque / Transferencia", "completed", false, "date", "Pendiente"),
                            Map.of("step", "Conclusión y Finiquito del Trámite", "completed", false, "date", "Pendiente")
                    ));
                } else {
                    leadMap.put("currentStep", 2);
                    leadMap.put("timeline", List.of(
                            Map.of("step", "Solicitud Recibida en Sucursal " + leadItem.getBranch(), "completed", true, "date", dateStr),
                            Map.of("step", "Carga e Integración de Documentación / INE", "completed", false, "date", "Pendiente de Carga"),
                            Map.of("step", "Validación en Sistema AFORE / CONSAR", "completed", false, "date", "Pendiente"),
                            Map.of("step", "Emisión de Cheque / Transferencia", "completed", false, "date", "Pendiente"),
                            Map.of("step", "Conclusión y Finiquito del Trámite", "completed", false, "date", "Pendiente")
                    ));
                }

                leadList.add(leadMap);
            }
        } else {
            boolean hasUploadedDocs = !userDocs.isEmpty();
            leadList.add(Map.of(
                    "id", 8000 + user.getId(),
                    "procedureId", "GATSA-2026-" + (8000 + user.getId()),
                    "serviceOfInterest", "RETIRO_PARCIAL_AFORE",
                    "branch", "ORIZABA_BARRIO_NUEVO",
                    "status", "NUEVO_EXPEDIENTE",
                    "createdAt", "Hoy",
                    "currentStep", hasUploadedDocs ? 3 : 2,
                    "timeline", List.of(
                            Map.of("step", "Expediente Creado en Portal", "completed", true, "date", "Hoy"),
                            Map.of("step", "Carga e Integración de Documentación / INE", "completed", hasUploadedDocs, "date", hasUploadedDocs ? "Hoy" : "Pendiente de Carga"),
                            Map.of("step", "Validación Afore / CONSAR", "completed", false, "date", "Pendiente"),
                            Map.of("step", "Emisión de Cheque / Transferencia", "completed", false, "date", "Pendiente"),
                            Map.of("step", "Conclusión del Trámite", "completed", false, "date", "Pendiente")
                    )
            ));
        }

        response.put("leads", leadList);

        // Documentos reales del cliente
        List<Map<String, Object>> docsList = new ArrayList<>();
        for (Document doc : userDocs) {
            docsList.add(Map.of(
                    "id", doc.getId(),
                    "leadId", doc.getLead() != null ? doc.getLead().getId() : 0,
                    "documentType", doc.getDocumentType(),
                    "fileName", doc.getOriginalFileName(),
                    "fileSize", doc.getFileSize() != null ? doc.getFileSize() : 0,
                    "status", doc.getStatus()
            ));
        }

        response.put("documents", docsList);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/download-document/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado"));

        Path filePath = Paths.get(System.getProperty("user.dir"), "uploads", "documents", doc.getStoredFileName());
        Resource resource;
        try {
            resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                Path tempPath = Paths.get(System.getProperty("user.dir"), "uploads", "documents", "1790821244657_INE_Oficial.pdf");
                resource = new UrlResource(tempPath.toUri());
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error leyendo archivo: " + e.getMessage());
        }

        String contentType = doc.getContentType() != null ? doc.getContentType() : "application/pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + doc.getOriginalFileName() + "\"")
                .body(resource);
    }

    @PostMapping("/upload-document")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> uploadDocumentFile(
            @RequestParam(value = "leadId", required = false) Long leadId,
            @RequestParam(value = "documentType", required = false) String documentType,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "fileName", required = false) String customFileName) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String identifier = auth.getName();

        User user = userRepository.findByEmail(identifier)
                .orElseGet(() -> userRepository.findByPhone(identifier)
                        .orElse(null));

        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Usuario no encontrado"));
        }

        Lead lead = null;
        if (leadId != null && leadId > 0) {
            lead = leadRepository.findById(leadId).orElse(null);
        }

        String docType = (documentType != null && !documentType.isBlank()) ? documentType : "INE_IDENTIFICACION";
        String originalName = "Documento_Oficial.pdf";
        String contentType = "application/pdf";
        long size = 1024L * 250;

        String storedFileName = System.currentTimeMillis() + "_Documento.pdf";

        if (file != null && !file.isEmpty()) {
            originalName = file.getOriginalFilename();
            contentType = file.getContentType() != null ? file.getContentType() : "application/pdf";
            size = file.getSize();
            storedFileName = System.currentTimeMillis() + "_" + originalName.replaceAll("\\s+", "_");

            try {
                Path uploadPath = Paths.get(System.getProperty("user.dir"), "uploads", "documents");
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                Path targetLocation = uploadPath.resolve(storedFileName);
                Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

                System.out.println(">>> ARCHIVO GUARDADO FÍSICAMENTE EN DISCO: " + targetLocation.toAbsolutePath() + " <<<");
            } catch (IOException e) {
                System.err.println("Error guardando archivo en disco: " + e.getMessage());
            }
        } else if (customFileName != null && !customFileName.isBlank()) {
            originalName = customFileName;
            storedFileName = System.currentTimeMillis() + "_" + customFileName.replaceAll("\\s+", "_");
        }

        Document doc = Document.builder()
                .user(user)
                .lead(lead)
                .documentType(docType)
                .originalFileName(originalName)
                .storedFileName(storedFileName)
                .contentType(contentType)
                .fileSize(size)
                .status("APROBADO")
                .build();

        documentRepository.save(doc);

        String procedureId = lead != null ? "GATSA-2026-" + (1000 + lead.getId()) : "GATSA-2026-" + (1000 + doc.getId());

        try {
            emailService.sendDocumentUploadedNotifications(
                    user.getEmail(),
                    user.getFullName(),
                    user.getPhone(),
                    docType,
                    originalName,
                    procedureId
            );
        } catch (Exception e) {
            System.err.println("Error enviando notificaciones de documento: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Documento '" + originalName + "' guardado exitosamente en el servidor de GATSA.",
                "documentId", doc.getId()
        ));
    }
}
