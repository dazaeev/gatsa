package com.gatsa.ecosystem.admin.controller;

import com.gatsa.ecosystem.config.model.SystemConfiguration;
import com.gatsa.ecosystem.config.repository.SystemConfigurationRepository;
import com.gatsa.ecosystem.model.User;
import com.gatsa.ecosystem.portalclient.model.Document;
import com.gatsa.ecosystem.portalclient.model.ProcedureDictamen;
import com.gatsa.ecosystem.portalclient.repository.DocumentRepository;
import com.gatsa.ecosystem.portalclient.repository.ProcedureDictamenRepository;
import com.gatsa.ecosystem.publicsite.model.Lead;
import com.gatsa.ecosystem.publicsite.repository.LeadRepository;
import com.gatsa.ecosystem.repository.UserRepository;
import com.gatsa.ecosystem.util.EmailService;
import com.gatsa.ecosystem.util.ProcedureUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private ProcedureDictamenRepository dictamenRepository;

    @Autowired
    private SystemConfigurationRepository configRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @GetMapping("/leads")
    public ResponseEntity<org.springframework.data.domain.Page<Lead>> getAllLeads(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "ALL") String branch) {

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                page, size, org.springframework.data.domain.Sort.by("createdAt").descending()
        );

        org.springframework.data.domain.Page<Lead> leadPage;

        boolean hasSearch = search != null && !search.isBlank();
        boolean hasBranch = branch != null && !"ALL".equalsIgnoreCase(branch);

        String cleanSearch = ProcedureUtils.cleanSearchTerm(search);
        Long exactId = ProcedureUtils.parseLeadIdFromSearch(search);

        if (hasSearch && hasBranch) {
            leadPage = leadRepository.searchLeadsByBranch(branch, cleanSearch, exactId, pageable);
        } else if (hasSearch) {
            leadPage = leadRepository.searchLeads(cleanSearch, exactId, pageable);
        } else if (hasBranch) {
            leadPage = leadRepository.findByBranch(branch, pageable);
        } else {
            leadPage = leadRepository.findAll(pageable);
        }

        for (Lead l : leadPage.getContent()) {
            String cleanPhone = l.getPhone() != null ? l.getPhone().replaceAll("\\D", "") : "";
            User u = userRepository.findByPhone(cleanPhone)
                    .orElseGet(() -> (l.getEmail() != null && !l.getEmail().isBlank()) ? userRepository.findByEmail(l.getEmail().trim()).orElse(null) : null);

            boolean hasDocs = false;
            if (u != null) {
                List<Document> docs = documentRepository.findByUserIdOrderByUploadedAtDesc(u.getId());
                hasDocs = !docs.isEmpty();
            }

            if ("NUEVO".equalsIgnoreCase(l.getStatus()) && hasDocs) {
                l.setStatus("DOCUMENTOS_RECIBIDOS");
            }

            l.setStatus(normalizeStatusByService(l.getServiceOfInterest(), l.getStatus()));
        }

        return ResponseEntity.ok(leadPage);
    }

    @PostMapping("/leads/{id}/status")
    public ResponseEntity<Map<String, Object>> updateLeadStatusAndDictamen(
            @PathVariable Long id,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "adminNote", required = false) String adminNote,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada con ID: " + id));

        String normStatus = normalizeStatusByService(lead.getServiceOfInterest(), status != null ? status : lead.getStatus());
        lead.setStatus(normStatus);

        if (adminNote != null && !adminNote.isBlank()) {
            lead.setAdminNote(adminNote.trim());
        }

        String originalName = null;
        String storedName = null;

        if (file != null && !file.isEmpty()) {
            originalName = file.getOriginalFilename();
            storedName = System.currentTimeMillis() + "_ADMIN_" + originalName.replaceAll("\\s+", "_");

            try {
                Path uploadPath = Paths.get(System.getProperty("user.dir"), "uploads", "documents");
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                Path targetLocation = uploadPath.resolve(storedName);
                Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

                lead.setAdminAttachmentFileName(originalName);
                lead.setAdminAttachmentStoredName(storedName);

                System.out.println(">>> ARCHIVO ENTREGABLE DE ADMIN GUARDADO EN DISCO: " + targetLocation.toAbsolutePath() + " <<<");
            } catch (IOException e) {
                System.err.println("Error guardando entregable de admin: " + e.getMessage());
            }
        }

        leadRepository.save(lead);

        int stepNum = calculateStepNumber(lead.getStatus());

        ProcedureDictamen dictamen = ProcedureDictamen.builder()
                .lead(lead)
                .stepNumber(stepNum)
                .status(lead.getStatus())
                .adminNote(adminNote != null ? adminNote.trim() : "")
                .attachmentFileName(originalName != null ? originalName : lead.getAdminAttachmentFileName())
                .attachmentStoredName(storedName != null ? storedName : lead.getAdminAttachmentStoredName())
                .build();

        dictamenRepository.save(dictamen);

        String procedureId = ProcedureUtils.generateProcedureId(lead.getId());

        try {
            if (lead.getEmail() != null && !lead.getEmail().isBlank()) {
                emailService.sendStatusChangedNotificationWithDictamen(
                        lead.getEmail(),
                        lead.getFullName(),
                        procedureId,
                        lead.getServiceOfInterest(),
                        lead.getStatus(),
                        lead.getAdminNote(),
                        lead.getAdminAttachmentFileName()
                );
            }
        } catch (Exception e) {
            System.err.println("Advertencia notificando dictamen: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Dictamen y estatus del trámite " + procedureId + " actualizados a '" + lead.getStatus() + "' en MySQL.",
                "leadId", lead.getId(),
                "status", lead.getStatus(),
                "adminNote", lead.getAdminNote() != null ? lead.getAdminNote() : "",
                "attachmentFileName", lead.getAdminAttachmentFileName() != null ? lead.getAdminAttachmentFileName() : ""
        ));
    }

    @DeleteMapping("/deliverables/{dictamenId}")
    public ResponseEntity<Map<String, Object>> deleteDeliverable(@PathVariable Long dictamenId) {
        ProcedureDictamen dictamen = dictamenRepository.findById(dictamenId)
                .orElseThrow(() -> new RuntimeException("Dictamen no encontrado"));

        if (dictamen.getAttachmentStoredName() != null && !dictamen.getAttachmentStoredName().isBlank()) {
            try {
                Path filePath = Paths.get(System.getProperty("user.dir"), "uploads", "documents", dictamen.getAttachmentStoredName());
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                System.err.println("Advertencia borrando entregable en disco: " + e.getMessage());
            }
        }

        dictamen.setAttachmentFileName(null);
        dictamen.setAttachmentStoredName(null);
        dictamenRepository.save(dictamen);

        return ResponseEntity.ok(Map.of("success", true, "message", "Entregable eliminado exitosamente."));
    }

    @GetMapping("/documents")
    public ResponseEntity<org.springframework.data.domain.Page<Map<String, Object>>> getAllDocumentsGroupedByClient(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "ALL") String branch) {

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<User> clientPage = userRepository.findAll(pageable);

        List<Map<String, Object>> resultList = new ArrayList<>();

        for (User client : clientPage.getContent()) {
            List<Document> userDocs = documentRepository.findByUserIdOrderByUploadedAtDesc(client.getId());
            List<Lead> clientLeads = leadRepository.findByPhoneOrEmailOrderByCreatedAtDesc(client.getPhone(), client.getEmail());

            if (userDocs.isEmpty() && clientLeads.isEmpty()) continue;

            // Filtro por búsqueda o sucursal si aplica
            boolean matchesSearch = search.isBlank() || 
                    client.getFullName().toLowerCase().contains(search.toLowerCase()) ||
                    (client.getPhone() != null && client.getPhone().contains(search)) ||
                    (client.getEmail() != null && client.getEmail().toLowerCase().contains(search.toLowerCase()));

            boolean matchesBranch = "ALL".equalsIgnoreCase(branch) || 
                    clientLeads.stream().anyMatch(l -> branch.equalsIgnoreCase(l.getBranch()));

            if (!matchesSearch || !matchesBranch) continue;

            Map<String, Object> clientGroup = new HashMap<>();
            clientGroup.put("userId", client.getId());
            clientGroup.put("clientName", client.getFullName());
            clientGroup.put("clientPhone", client.getPhone());
            clientGroup.put("clientEmail", client.getEmail());

            List<Map<String, Object>> leadItems = new ArrayList<>();
            for (Lead leadItem : clientLeads) {
                Map<String, Object> leadMap = new HashMap<>();
                leadMap.put("leadId", leadItem.getId());
                leadMap.put("procedureId", ProcedureUtils.generateProcedureId(leadItem.getId()));
                leadMap.put("serviceOfInterest", leadItem.getServiceOfInterest());
                leadMap.put("branch", leadItem.getBranch());
                
                String rawStatus = leadItem.getStatus();
                if ("NUEVO".equalsIgnoreCase(rawStatus) && !userDocs.isEmpty()) {
                    rawStatus = "DOCUMENTOS_RECIBIDOS";
                }

                String normStatus = normalizeStatusByService(leadItem.getServiceOfInterest(), rawStatus);
                leadMap.put("status", normStatus);
                leadMap.put("adminNote", leadItem.getAdminNote() != null ? leadItem.getAdminNote() : "");
                leadMap.put("adminAttachmentFileName", leadItem.getAdminAttachmentFileName() != null ? leadItem.getAdminAttachmentFileName() : "");

                // Documentos recibidos del cliente
                List<Map<String, Object>> docMaps = new ArrayList<>();
                for (Document doc : userDocs) {
                    if ("INE_IDENTIFICACION".equalsIgnoreCase(doc.getDocumentType()) 
                            || (doc.getLead() != null && doc.getLead().getId().equals(leadItem.getId()))) {
                        docMaps.add(Map.of(
                                "id", doc.getId(),
                                "documentType", doc.getDocumentType(),
                                "fileName", doc.getOriginalFileName(),
                                "fileSize", doc.getFileSize() != null ? doc.getFileSize() : 0,
                                "status", doc.getStatus(),
                                "uploadedAt", doc.getUploadedAt() != null ? doc.getUploadedAt().toString() : "Reciente"
                        ));
                    }
                }

                // Entregables emitidos por el Administrador para este trámite
                List<ProcedureDictamen> dictamens = dictamenRepository.findByLeadIdOrderByCreatedAtAsc(leadItem.getId());
                List<Map<String, Object>> deliverables = new ArrayList<>();
                for (ProcedureDictamen pd : dictamens) {
                    if (pd.getAttachmentFileName() != null && !pd.getAttachmentFileName().isBlank()) {
                        deliverables.add(Map.of(
                                "id", pd.getId(),
                                "stepNumber", pd.getStepNumber(),
                                "status", pd.getStatus(),
                                "adminNote", pd.getAdminNote() != null ? pd.getAdminNote() : "",
                                "fileName", pd.getAttachmentFileName()
                        ));
                    }
                }

                leadMap.put("documents", docMaps);
                leadMap.put("deliverables", deliverables);
                leadItems.add(leadMap);
            }

            clientGroup.put("procedures", leadItems);
            resultList.add(clientGroup);
        }

        org.springframework.data.domain.Page<Map<String, Object>> resultPage = new org.springframework.data.domain.PageImpl<>(
                resultList, pageable, clientPage.getTotalElements()
        );

        return ResponseEntity.ok(resultPage);
    }

    private int calculateStepNumber(String status) {
        if (status == null) return 1;
        String s = status.toUpperCase().trim();
        if (s.contains("CONCLUIDO") || s.contains("FINALIZADO")) return 5;
        if (s.contains("CHEQUE") || s.contains("PAGO") || s.contains("TARJETA")) return 4;
        if (s.contains("VALIDACION") || s.contains("EMISION") || s.contains("AVALUO") || s.contains("POLIZA")) return 3;
        if (s.contains("DOCUMENTOS")) return 2;
        return 1;
    }

    private String normalizeStatusByService(String service, String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) return "NUEVO";
        String s = service != null ? service.toUpperCase() : "";
        String st = rawStatus.toUpperCase().trim();

        if (s.contains("SEGURO") || s.contains("COTIZADOR")) {
            if ("EN_VALIDACION_CONSAR".equals(st) || "AVALUO_MEJORAVIT".equals(st)) return "POLIZA_EN_EMISION";
            if ("CHEQUE_EMITIDO".equals(st) || "TARJETA_AUTORIZADA".equals(st)) return "PAGO_CONFIRMADO";
        } else if (s.contains("MEJORAVIT")) {
            if ("EN_VALIDACION_CONSAR".equals(st) || "POLIZA_EN_EMISION".equals(st)) return "AVALUO_MEJORAVIT";
            if ("CHEQUE_EMITIDO".equals(st) || "PAGO_CONFIRMADO".equals(st)) return "TARJETA_AUTORIZADA";
        } else {
            if ("POLIZA_EN_EMISION".equals(st) || "AVALUO_MEJORAVIT".equals(st)) return "EN_VALIDACION_CONSAR";
            if ("PAGO_CONFIRMADO".equals(st) || "TARJETA_AUTORIZADA".equals(st)) return "CHEQUE_EMITIDO";
        }

        return st;
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getConfig() {
        String adminEmail = configRepository.findByConfigKey("ADMIN_NOTIFICATION_EMAIL")
                .map(SystemConfiguration::getConfigValue)
                .orElse("ing.dazaeev@gmail.com");

        return ResponseEntity.ok(Map.of("adminEmail", adminEmail));
    }

    @PostMapping("/config")
    public ResponseEntity<Map<String, Object>> updateConfig(@RequestBody Map<String, String> request) {
        String newEmail = request.get("adminEmail");
        if (newEmail != null && !newEmail.isBlank()) {
            SystemConfiguration config = configRepository.findByConfigKey("ADMIN_NOTIFICATION_EMAIL")
                    .orElse(SystemConfiguration.builder().configKey("ADMIN_NOTIFICATION_EMAIL").build());
            config.setConfigValue(newEmail.trim());
            config.setDescription("Correo de notificaciones administrativas");
            configRepository.save(config);
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Configuración de notificaciones actualizada en MySQL."));
    }
}
