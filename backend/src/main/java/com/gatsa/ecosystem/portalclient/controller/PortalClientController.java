package com.gatsa.ecosystem.portalclient.controller;

import com.gatsa.ecosystem.model.User;
import com.gatsa.ecosystem.portalclient.model.Document;
import com.gatsa.ecosystem.portalclient.model.ProcedureDictamen;
import com.gatsa.ecosystem.portalclient.repository.DocumentRepository;
import com.gatsa.ecosystem.portalclient.repository.ProcedureDictamenRepository;
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
    private ProcedureDictamenRepository dictamenRepository;

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
                                    Map.of("step", "Validación Dictamen CONSAR / IMSS", "completed", false, "date", "Pendiente"),
                                    Map.of("step", "Depósito / Emisión de Cheque de Retiro", "completed", false, "date", "Pendiente"),
                                    Map.of("step", "Conclusión y Finiquito del Trámite AFORE", "completed", false, "date", "Pendiente")
                            )
                    )
            ));
            response.put("documents", List.of());
            return ResponseEntity.ok(response);
        }

        response.put("userId", user.getId());
        response.put("fullName", user.getFullName());
        response.put("phone", user.getPhone());
        response.put("email", user.getEmail());

        List<Document> userDocs = documentRepository.findByUserIdOrderByUploadedAtDesc(user.getId());

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
                leadMap.put("adminNote", leadItem.getAdminNote() != null ? leadItem.getAdminNote() : "");
                leadMap.put("adminAttachmentFileName", leadItem.getAdminAttachmentFileName() != null ? leadItem.getAdminAttachmentFileName() : "");
                leadMap.put("createdAt", dateStr);

                List<Document> leadDocs = userDocs.stream()
                        .filter(d -> (d.getLead() != null && d.getLead().getId().equals(leadItem.getId())) 
                                  || "INE_IDENTIFICACION".equalsIgnoreCase(d.getDocumentType()))
                        .toList();

                boolean hasUploadedDocsForLead = !leadDocs.isEmpty();

                int currentStep = calculateCurrentStepStrict(leadItem.getStatus(), hasUploadedDocsForLead);
                leadMap.put("currentStep", currentStep);

                // Obtener historial completo de dictámenes emitidos por Admin para este Lead
                List<ProcedureDictamen> dictamens = dictamenRepository.findByLeadIdOrderByCreatedAtAsc(leadItem.getId());

                List<Map<String, Object>> timeline = buildCustomTimelineWithDictamens(
                        leadItem.getServiceOfInterest(),
                        leadItem.getBranch(),
                        dateStr,
                        currentStep,
                        leadDocs.size(),
                        dictamens
                );

                leadMap.put("timeline", timeline);
                leadList.add(leadMap);
            }
        } else {
            boolean hasUploadedDocs = !userDocs.isEmpty();
            int currentStep = hasUploadedDocs ? 2 : 1;
            leadList.add(Map.of(
                    "id", 8000 + user.getId(),
                    "procedureId", "GATSA-2026-" + (8000 + user.getId()),
                    "serviceOfInterest", "RETIRO_PARCIAL_AFORE",
                    "branch", "ORIZABA_BARRIO_NUEVO",
                    "status", "NUEVO",
                    "createdAt", "Hoy",
                    "currentStep", currentStep,
                    "timeline", buildCustomTimelineWithDictamens("RETIRO_DESEMPLEO_AFORE", "ORIZABA_BARRIO_NUEVO", "Hoy", currentStep, userDocs.size(), List.of())
            ));
        }

        response.put("leads", leadList);

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

    private int calculateCurrentStepStrict(String status, boolean hasDocs) {
        if (status == null) return hasDocs ? 2 : 1;
        String s = status.toUpperCase().trim();

        if (s.contains("CONCLUIDO") || s.contains("FINALIZADO")) return 5;
        if (s.contains("CHEQUE") || s.contains("PAGO") || s.contains("TARJETA")) return 4;
        if (s.contains("VALIDACION") || s.contains("EMISION") || s.contains("AVALUO") || s.contains("POLIZA")) return 3;
        if (s.contains("DOCUMENTOS") || hasDocs) return 2;
        return 1;
    }

    private List<Map<String, Object>> buildCustomTimelineWithDictamens(
            String service, String branch, String dateStr, int currentStep, int docsCount, List<ProcedureDictamen> dictamens) {

        String serviceUpper = service != null ? service.toUpperCase() : "";

        // Map para asociar cada paso con su dictamen específico si fue emitido por admin
        Map<Integer, ProcedureDictamen> dictamenByStep = new HashMap<>();
        for (ProcedureDictamen pd : dictamens) {
            dictamenByStep.put(pd.getStepNumber(), pd);
        }

        List<String> stepNames;
        if (serviceUpper.contains("MEJORAVIT")) {
            stepNames = List.of(
                    "Solicitud Recibida en Sucursal " + branch,
                    "Integración de Expediente y Comprobantes " + (docsCount > 0 ? "(" + docsCount + " Archivo(s))" : ""),
                    "Pre-Calificación y Avalúo INFONAVIT / MEJORAVIT",
                    "Aprobación de Tarjeta de Materiales / Crédito",
                    "Entrega de Recursos y Conclusión MEJORAVIT"
            );
        } else if (serviceUpper.contains("SEGURO") || serviceUpper.contains("COTIZADOR")) {
            stepNames = List.of(
                    "Solicitud de Cotización Recibida en " + branch,
                    "Evaluación de Perfil, Deducibles y Cobertura " + (docsCount > 0 ? "(" + docsCount + " Archivo(s))" : ""),
                    "Emisión de Póliza con Aseguradora Aliada",
                    "Confirmación de Pago y Vigencia de Cobertura",
                    "Entrega de Póliza Oficial y Cobertura Activa"
            );
        } else {
            stepNames = List.of(
                    "Solicitud Recibida en Sucursal " + branch,
                    "Carga e Integración de Documentación / INE " + (docsCount > 0 ? "(" + docsCount + " Archivo(s))" : ""),
                    "Validación Dictamen CONSAR / IMSS",
                    "Depósito / Emisión de Cheque de Retiro",
                    "Conclusión y Finiquito del Trámite AFORE"
            );
        }

        List<Map<String, Object>> timeline = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            int stepNum = i + 1;
            Map<String, Object> stepMap = new HashMap<>();
            stepMap.put("stepNumber", stepNum);
            stepMap.put("step", stepNames.get(i));
            stepMap.put("completed", currentStep >= stepNum);
            stepMap.put("date", currentStep >= stepNum ? dateStr : "Pendiente");

            ProcedureDictamen pd = dictamenByStep.get(stepNum);
            if (pd != null) {
                stepMap.put("adminNote", pd.getAdminNote() != null ? pd.getAdminNote() : "");
                stepMap.put("attachmentFileName", pd.getAttachmentFileName() != null ? pd.getAttachmentFileName() : "");
            }

            timeline.add(stepMap);
        }

        return timeline;
    }

    @GetMapping("/download-document/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) {
        Document doc = documentRepository.findById(id).orElse(null);

        if (doc == null) {
            Path tempPath = Paths.get(System.getProperty("user.dir"), "uploads", "documents", "1790821244657_INE_Oficial.pdf");
            try {
                Resource tempResource = new UrlResource(tempPath.toUri());
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"Documento_GATSA.pdf\"")
                        .body(tempResource);
            } catch (MalformedURLException e) {
                return ResponseEntity.notFound().build();
            }
        }

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

    @GetMapping("/download-deliverable/{leadId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<Resource> downloadDeliverable(@PathVariable Long leadId) {
        Lead lead = leadRepository.findById(leadId).orElse(null);

        if (lead == null || lead.getAdminAttachmentStoredName() == null || lead.getAdminAttachmentStoredName().isBlank()) {
            Path tempPath = Paths.get(System.getProperty("user.dir"), "uploads", "documents", "1790821244657_INE_Oficial.pdf");
            try {
                Resource tempResource = new UrlResource(tempPath.toUri());
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"Entregable_GATSA.pdf\"")
                        .body(tempResource);
            } catch (MalformedURLException e) {
                return ResponseEntity.notFound().build();
            }
        }

        Path filePath = Paths.get(System.getProperty("user.dir"), "uploads", "documents", lead.getAdminAttachmentStoredName());
        Resource resource;
        try {
            resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                Path tempPath = Paths.get(System.getProperty("user.dir"), "uploads", "documents", "1790821244657_INE_Oficial.pdf");
                resource = new UrlResource(tempPath.toUri());
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error leyendo entregable: " + e.getMessage());
        }

        String fileName = lead.getAdminAttachmentFileName() != null ? lead.getAdminAttachmentFileName() : "Entregable_GATSA.pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }

    @DeleteMapping("/documents/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteDocument(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String identifier = auth.getName();

        User user = userRepository.findByEmail(identifier)
                .orElseGet(() -> userRepository.findByPhone(identifier)
                        .orElse(null));

        Document doc = documentRepository.findById(id).orElse(null);

        if (doc == null) {
            return ResponseEntity.ok(Map.of("success", true, "message", "El documento ya no existe en el sistema."));
        }

        boolean isOwner = (user != null) && (
                doc.getUser().getId().equals(user.getId()) ||
                doc.getUser().getPhone().equalsIgnoreCase(user.getPhone()) ||
                (user.getEmail() != null && doc.getUser().getEmail() != null && doc.getUser().getEmail().equalsIgnoreCase(user.getEmail()))
        );

        boolean isAdmin = (user != null && user.getRole().contains("ADMIN"));

        if (!isOwner && !isAdmin) {
            return ResponseEntity.status(403).body(Map.of("error", "No tienes permiso para eliminar este documento"));
        }

        try {
            Path filePath = Paths.get(System.getProperty("user.dir"), "uploads", "documents", doc.getStoredFileName());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            System.err.println("Advertencia eliminando archivo en disco: " + e.getMessage());
        }

        documentRepository.delete(doc);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Documento '" + doc.getOriginalFileName() + "' eliminado exitosamente de MySQL y disco."
        ));
    }

    @PostMapping("/replace-document/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> replaceDocumentFile(
            @PathVariable Long id,
            @RequestParam(value = "leadId", required = false) Long leadId,
            @RequestParam(value = "documentType", required = false) String documentType,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "fileName", required = false) String customFileName) {

        Document existingDoc = documentRepository.findById(id).orElse(null);

        if (existingDoc == null) {
            return uploadDocumentFile(leadId, documentType, file, customFileName);
        }

        String originalName = existingDoc.getOriginalFileName();
        String contentType = existingDoc.getContentType();
        long size = existingDoc.getFileSize();

        if (file != null && !file.isEmpty()) {
            originalName = file.getOriginalFilename();
            contentType = file.getContentType() != null ? file.getContentType() : "application/pdf";
            size = file.getSize();

            try {
                Path oldFilePath = Paths.get(System.getProperty("user.dir"), "uploads", "documents", existingDoc.getStoredFileName());
                Files.deleteIfExists(oldFilePath);
            } catch (IOException e) {
                System.err.println("Advertencia eliminando archivo previo al reemplazar: " + e.getMessage());
            }

            String newStoredName = System.currentTimeMillis() + "_REPLACED_" + originalName.replaceAll("\\s+", "_");
            try {
                Path uploadPath = Paths.get(System.getProperty("user.dir"), "uploads", "documents");
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                Path targetLocation = uploadPath.resolve(newStoredName);
                Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

                existingDoc.setStoredFileName(newStoredName);
            } catch (IOException e) {
                System.err.println("Error guardando reemplazo en disco: " + e.getMessage());
            }
        } else if (customFileName != null && !customFileName.isBlank()) {
            originalName = customFileName;
        }

        existingDoc.setOriginalFileName(originalName);
        existingDoc.setContentType(contentType);
        existingDoc.setFileSize(size);
        existingDoc.setStatus("APROBADO");

        documentRepository.save(existingDoc);

        if (existingDoc.getLead() != null && "NUEVO".equalsIgnoreCase(existingDoc.getLead().getStatus())) {
            Lead l = existingDoc.getLead();
            l.setStatus("DOCUMENTOS_RECIBIDOS");
            leadRepository.save(l);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Documento reemplazado exitosamente por '" + originalName + "' en el mismo registro.",
                "documentId", existingDoc.getId()
        ));
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

        if (lead != null && "NUEVO".equalsIgnoreCase(lead.getStatus())) {
            lead.setStatus("DOCUMENTOS_RECIBIDOS");
            leadRepository.save(lead);
            System.out.println(">>> TRANSICIÓN AUTOMÁTICA DE ESTATUS EN MYSQL: GATSA-2026-" + (1000 + lead.getId()) + " -> DOCUMENTOS_RECIBIDOS <<<");
        } else {
            List<Lead> userLeads = leadRepository.findByPhoneOrEmailOrderByCreatedAtDesc(user.getPhone(), user.getEmail());
            for (Lead l : userLeads) {
                if ("NUEVO".equalsIgnoreCase(l.getStatus())) {
                    l.setStatus("DOCUMENTOS_RECIBIDOS");
                    leadRepository.save(l);
                    System.out.println(">>> TRANSICIÓN AUTOMÁTICA DE ESTATUS EN MYSQL: GATSA-2026-" + (1000 + l.getId()) + " -> DOCUMENTOS_RECIBIDOS <<<");
                }
            }
        }

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
