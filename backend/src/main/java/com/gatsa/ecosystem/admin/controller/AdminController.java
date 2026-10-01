package com.gatsa.ecosystem.admin.controller;

import com.gatsa.ecosystem.config.model.SystemConfiguration;
import com.gatsa.ecosystem.config.repository.SystemConfigurationRepository;
import com.gatsa.ecosystem.model.User;
import com.gatsa.ecosystem.portalclient.model.Document;
import com.gatsa.ecosystem.portalclient.repository.DocumentRepository;
import com.gatsa.ecosystem.publicsite.model.Lead;
import com.gatsa.ecosystem.publicsite.repository.LeadRepository;
import com.gatsa.ecosystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

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
    private SystemConfigurationRepository configRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/leads")
    public ResponseEntity<List<Lead>> getAllLeads() {
        return ResponseEntity.ok(leadRepository.findAll());
    }

    @GetMapping("/documents")
    public ResponseEntity<List<Map<String, Object>>> getAllDocumentsGroupedByClient() {
        List<User> clients = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (User client : clients) {
            // Documentos de este cliente
            List<Document> userDocs = documentRepository.findByUserIdOrderByUploadedAtDesc(client.getId());
            if (userDocs.isEmpty()) continue; // Omitir clientes sin documentos

            // Solicitudes/Trámites de este cliente
            List<Lead> clientLeads = leadRepository.findByPhoneOrderByCreatedAtDesc(client.getPhone());
            if (clientLeads.isEmpty() && client.getEmail() != null) {
                clientLeads = leadRepository.findByEmailOrderByCreatedAtDesc(client.getEmail());
            }

            Map<String, Object> clientGroup = new HashMap<>();
            clientGroup.put("userId", client.getId());
            clientGroup.put("clientName", client.getFullName());
            clientGroup.put("clientPhone", client.getPhone());
            clientGroup.put("clientEmail", client.getEmail());

            List<Map<String, Object>> leadItems = new ArrayList<>();
            for (Lead leadItem : clientLeads) {
                Map<String, Object> leadMap = new HashMap<>();
                leadMap.put("leadId", leadItem.getId());
                leadMap.put("procedureId", "GATSA-2026-" + (1000 + leadItem.getId()));
                leadMap.put("serviceOfInterest", leadItem.getServiceOfInterest());
                leadMap.put("branch", leadItem.getBranch());
                leadMap.put("status", leadItem.getStatus());

                // Documentos específicos de este trámite + documentos globales (INE)
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

                leadMap.put("documents", docMaps);
                leadItems.add(leadMap);
            }

            // Si el cliente no tiene leads pero sí documentos
            if (leadItems.isEmpty()) {
                List<Map<String, Object>> docMaps = new ArrayList<>();
                for (Document doc : userDocs) {
                    docMaps.add(Map.of(
                            "id", doc.getId(),
                            "documentType", doc.getDocumentType(),
                            "fileName", doc.getOriginalFileName(),
                            "fileSize", doc.getFileSize() != null ? doc.getFileSize() : 0,
                            "status", doc.getStatus(),
                            "uploadedAt", doc.getUploadedAt() != null ? doc.getUploadedAt().toString() : "Reciente"
                    ));
                }
                leadItems.add(Map.of(
                        "leadId", 0,
                        "procedureId", "GATSA-2026-" + (8000 + client.getId()),
                        "serviceOfInterest", "RETIRO_PARCIAL_AFORE",
                        "branch", "ORIZABA_BARRIO_NUEVO",
                        "status", "NUEVO_EXPEDIENTE",
                        "documents", docMaps
                ));
            }

            clientGroup.put("procedures", leadItems);
            result.add(clientGroup);
        }

        return ResponseEntity.ok(result);
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
