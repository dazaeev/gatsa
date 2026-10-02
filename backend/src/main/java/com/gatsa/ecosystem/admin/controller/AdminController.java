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
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
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
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'GERENTE_SUCURSAL', 'AGENTE_COMPLETO', 'OPERADOR_IMSS')")
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
            @RequestParam(defaultValue = "ALL") String branch,
            org.springframework.security.core.Authentication auth) {

        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseGet(() -> userRepository.findByPhone(auth.getName()).orElse(null));

        boolean isSuper = currentUser != null && ("ROLE_SUPER_ADMIN".equalsIgnoreCase(currentUser.getRole()) || "ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole()));

        // Si el usuario no es Super Admin / Admin, forzar SIEMPRE el filtro a la sucursal asignada del colaborador
        String effectiveBranch = branch;
        if (!isSuper) {
            if (currentUser != null && currentUser.getBranch() != null) {
                effectiveBranch = currentUser.getBranch().getCode();
            } else {
                // Si el gerente no tiene sucursal asignada en MySQL, retornar página vacía
                return ResponseEntity.ok(org.springframework.data.domain.Page.empty());
            }
        }

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                page, size, org.springframework.data.domain.Sort.by("createdAt").descending()
        );

        org.springframework.data.domain.Page<Lead> leadPage;

        boolean hasSearch = search != null && !search.isBlank();
        boolean hasBranch = effectiveBranch != null && !"ALL".equalsIgnoreCase(effectiveBranch);

        String cleanSearch = ProcedureUtils.cleanSearchTerm(search);
        Long exactId = ProcedureUtils.parseLeadIdFromSearch(search);

        if (hasSearch && hasBranch) {
            leadPage = leadRepository.searchLeadsByBranch(effectiveBranch, cleanSearch, exactId, pageable);
        } else if (hasSearch && !isSuper) {
            leadPage = leadRepository.searchLeadsByBranch(effectiveBranch, cleanSearch, exactId, pageable);
        } else if (hasSearch) {
            leadPage = leadRepository.searchLeads(cleanSearch, exactId, pageable);
        } else if (hasBranch) {
            leadPage = leadRepository.findByBranch(effectiveBranch, pageable);
        } else {
            leadPage = leadRepository.findAll(pageable);
        }

        for (Lead l : leadPage.getContent()) {
            String cleanPhone = l.getPhone() != null ? l.getPhone().replaceAll("\\D", "") : "";
            User u = userRepository.findByPhone(cleanPhone)
                    .orElseGet(() -> (l.getEmail() != null && !l.getEmail().isBlank()) ? userRepository.findByEmail(l.getEmail().trim()).orElse(null) : null);

            // Sincronizar el nombre con la cuenta del usuario en MySQL si existe
            if (u != null && u.getFullName() != null && !u.getFullName().isBlank()) {
                l.setFullName(u.getFullName());
            }

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
            @RequestParam(defaultValue = "ALL") String branch,
            org.springframework.security.core.Authentication auth) {

        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseGet(() -> userRepository.findByPhone(auth.getName()).orElse(null));

        boolean isSuper = currentUser != null && ("ROLE_SUPER_ADMIN".equalsIgnoreCase(currentUser.getRole()) || "ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole()));

        String effectiveBranch = branch;
        if (!isSuper) {
            if (currentUser != null && currentUser.getBranch() != null) {
                effectiveBranch = currentUser.getBranch().getCode();
            } else {
                return ResponseEntity.ok(org.springframework.data.domain.Page.empty());
            }
        }

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

            final String branchToFilter = effectiveBranch;
            List<Lead> filteredLeads = clientLeads.stream()
                    .filter(l -> "ALL".equalsIgnoreCase(branchToFilter) || branchToFilter.equalsIgnoreCase(l.getBranch()))
                    .toList();

            if (!matchesSearch || filteredLeads.isEmpty()) continue;

            Map<String, Object> clientGroup = new HashMap<>();
            clientGroup.put("userId", client.getId());
            clientGroup.put("clientName", client.getFullName());
            clientGroup.put("clientPhone", client.getPhone());
            clientGroup.put("clientEmail", client.getEmail());

            List<Map<String, Object>> leadItems = new ArrayList<>();
            for (Lead leadItem : filteredLeads) {
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

        String imssCookie = configRepository.findByConfigKey("IMSS_JORDAN_COOKIE")
                .map(SystemConfiguration::getConfigValue)
                .orElse("");

        Map<String, String> resp = new HashMap<>();
        resp.put("adminEmail", adminEmail);
        resp.put("imssCookie", imssCookie);

        return ResponseEntity.ok(resp);
    }

    @PostMapping("/imss/cookie")
    public ResponseEntity<Map<String, Object>> saveImssCookie(@RequestBody Map<String, String> body) {
        String cookie = body.get("cookie");
        if (cookie != null) {
            SystemConfiguration config = configRepository.findByConfigKey("IMSS_JORDAN_COOKIE")
                    .orElse(SystemConfiguration.builder().configKey("IMSS_JORDAN_COOKIE").build());
            config.setConfigValue(cookie.trim());
            config.setDescription("Cookie de sesión para la API externa Jordan Digital IMSS Semanas");
            configRepository.save(config);
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Cookie de IMSS/Jordan guardada correctamente."));
    }

    @PostMapping("/imss/consultar-semanas")
    public ResponseEntity<Map<String, Object>> consultarSemanasImss(@RequestBody Map<String, String> body) {
        String curp = body.get("curp");
        String tipoCorreo = body.getOrDefault("tipoCorreo", "hotmail");

        if (curp == null || curp.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "La CURP es requerida"));
        }

        String storedCookie = configRepository.findByConfigKey("IMSS_JORDAN_COOKIE")
                .map(SystemConfiguration::getConfigValue)
                .orElse("");

        RestTemplate restTemplate = new RestTemplate();

        try {
            // 1. Iniciar procesar CURP
            String procesarUrl = "https://jordan-digital.com/SemanasMultiple/procesar";
            HttpHeaders headers1 = new HttpHeaders();
            headers1.setContentType(MediaType.APPLICATION_JSON);
            if (!storedCookie.isBlank()) {
                headers1.set("Cookie", storedCookie);
            }

            Map<String, Object> req1 = new HashMap<>();
            req1.put("curps", List.of(curp.trim().toUpperCase()));
            req1.put("tipo_correo", tipoCorreo);
            req1.put("autorizacion", "1");

            HttpEntity<Map<String, Object>> entity1 = new HttpEntity<>(req1, headers1);
            ResponseEntity<Map> resp1 = restTemplate.postForEntity(procesarUrl, entity1, Map.class);

            // Verificar si devolvió sid o si requiere cookie
            if (resp1.getBody() != null && resp1.getBody().containsKey("error") && resp1.getBody().get("error").toString().contains("expirada")) {
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Cookie de sesión Jordan expirada. Actualícela en la pestaña Configuración."));
            }

            // Extraer SID de la respuesta de /procesar
            String sid = null;
            if (resp1.getBody() != null) {
                Map respMap = resp1.getBody();
                if (respMap.containsKey("items") && respMap.get("items") instanceof List) {
                    List<?> items = (List<?>) respMap.get("items");
                    if (!items.isEmpty() && items.get(0) instanceof Map) {
                        Map<?, ?> firstItem = (Map<?, ?>) items.get(0);
                        if (firstItem.containsKey("sid") && firstItem.get("sid") != null) {
                            sid = firstItem.get("sid").toString();
                        }
                    }
                }
                if (sid == null && respMap.containsKey("sids") && respMap.get("sids") instanceof List) {
                    List<?> sids = (List<?>) respMap.get("sids");
                    if (!sids.isEmpty()) sid = sids.get(0).toString();
                }
                if (sid == null && respMap.containsKey("sid") && respMap.get("sid") != null) {
                    sid = respMap.get("sid").toString();
                }
                if (sid == null && respMap.containsKey("data") && respMap.get("data") instanceof List) {
                    List<?> dataList = (List<?>) respMap.get("data");
                    if (!dataList.isEmpty() && dataList.get(0) instanceof Map) {
                        Map<?, ?> item = (Map<?, ?>) dataList.get(0);
                        if (item.containsKey("sid") && item.get("sid") != null) sid = item.get("sid").toString();
                    }
                }
            }

            if (sid == null) {
                return ResponseEntity.ok(Map.of(
                        "success", false,
                        "rawProcessResponse", resp1.getBody(),
                        "message", "No se pudo obtener el 'sid' de la respuesta de Jordan Digital. Verifique el log raw."
                ));
            }

            // 2. Consultar estado con el SID obtenido (con reintentos/polling por si el PDF tarda unos segundos en generarse)
            String estadosUrl = "https://jordan-digital.com/SemanasMultiple/estados";
            HttpHeaders headers2 = new HttpHeaders();
            headers2.setContentType(MediaType.APPLICATION_JSON);
            if (!storedCookie.isBlank()) {
                headers2.set("Cookie", storedCookie);
            }

            Map<String, Object> req2 = Map.of("sids", List.of(sid));
            HttpEntity<Map<String, Object>> entity2 = new HttpEntity<>(req2, headers2);

            String pdfFileName = null;
            Map resp2Body = null;

            // Intentar hasta 6 veces (hasta 12 segundos) consultar el estado hasta obtener el archivo_generado
            for (int attempt = 1; attempt <= 6; attempt++) {
                ResponseEntity<Map> resp2 = restTemplate.postForEntity(estadosUrl, entity2, Map.class);
                resp2Body = resp2.getBody();

                if (resp2Body != null) {
                    pdfFileName = extractArchivoGenerado(resp2Body);
                    if (pdfFileName != null && !pdfFileName.isBlank()) {
                        break;
                    }
                }
                try { Thread.sleep(2000); } catch (InterruptedException ignored) {}
            }

            String pdfUrl = null;
            if (pdfFileName != null && !pdfFileName.isBlank()) {
                pdfUrl = "/api/v1/admin/imss/download-pdf?file=" + pdfFileName;

                // Guardar copia local en el control de archivos del servidor
                try {
                    HttpHeaders downloadHeaders = new HttpHeaders();
                    if (!storedCookie.isBlank()) {
                        downloadHeaders.set("Cookie", storedCookie);
                    }
                    HttpEntity<Void> downloadEntity = new HttpEntity<>(downloadHeaders);
                    String remoteDownloadUrl = "https://jordan-digital.com/download/" + pdfFileName;
                    ResponseEntity<byte[]> pdfResponse = restTemplate.exchange(remoteDownloadUrl, HttpMethod.GET, downloadEntity, byte[].class);

                    if (pdfResponse.getStatusCode() == HttpStatus.OK && pdfResponse.getBody() != null) {
                        Path uploadPath = Paths.get(System.getProperty("user.dir"), "uploads", "imss_semanas");
                        if (!Files.exists(uploadPath)) {
                            Files.createDirectories(uploadPath);
                        }
                        Path targetLocation = uploadPath.resolve(pdfFileName);
                        Files.write(targetLocation, pdfResponse.getBody());
                        System.out.println(">>> REPORTE IMSS GUARDADO EN CONTROL DE ARCHIVOS LOCAL: " + targetLocation.toAbsolutePath() + " <<<");
                    }
                } catch (Exception e) {
                    System.err.println("Advertencia guardando copia local de semanas IMSS: " + e.getMessage());
                }
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "curp", curp,
                    "sid", sid,
                    "pdfFileName", pdfFileName != null ? pdfFileName : "",
                    "estadoResponse", resp2Body != null ? resp2Body : Map.of(),
                    "pdfUrl", pdfUrl != null ? pdfUrl : "",
                    "message", pdfUrl != null ? "¡Consulta y PDF generados exitosamente!" : "Proceso iniciado. El servidor aún está procesando el PDF, vuelva a consultar en unos momentos."
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Error durante la integración con Jordan Digital: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/imss/download-pdf")
    public ResponseEntity<byte[]> downloadImssPdf(@RequestParam("file") String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        // 1. Verificar si ya existe en el almacenamiento local del servidor
        try {
            Path localFilePath = Paths.get(System.getProperty("user.dir"), "uploads", "imss_semanas", fileName.trim());
            if (Files.exists(localFilePath)) {
                byte[] localBytes = Files.readAllBytes(localFilePath);
                HttpHeaders responseHeaders = new HttpHeaders();
                responseHeaders.setContentType(MediaType.APPLICATION_PDF);
                responseHeaders.setContentDisposition(ContentDisposition.attachment().filename(fileName).build());
                return new ResponseEntity<>(localBytes, responseHeaders, HttpStatus.OK);
            }
        } catch (Exception e) {
            System.err.println("Advertencia leyendo PDF local de semanas: " + e.getMessage());
        }

        // 2. Si no existe localmente, descargarlo de Jordan Digital con la Cookie
        String storedCookie = configRepository.findByConfigKey("IMSS_JORDAN_COOKIE")
                .map(SystemConfiguration::getConfigValue)
                .orElse("");

        try {
            String downloadUrl = "https://jordan-digital.com/download/" + fileName.trim();
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            if (!storedCookie.isBlank()) {
                headers.set("Cookie", storedCookie);
            }

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<byte[]> response = restTemplate.exchange(downloadUrl, HttpMethod.GET, entity, byte[].class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                // Guardar copia local para futuras consultas del control de archivos
                try {
                    Path uploadPath = Paths.get(System.getProperty("user.dir"), "uploads", "imss_semanas");
                    if (!Files.exists(uploadPath)) {
                        Files.createDirectories(uploadPath);
                    }
                    Files.write(uploadPath.resolve(fileName.trim()), response.getBody());
                } catch (Exception ignored) {}
            }

            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentType(MediaType.APPLICATION_PDF);
            responseHeaders.setContentDisposition(ContentDisposition.attachment().filename(fileName).build());

            return new ResponseEntity<>(response.getBody(), responseHeaders, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error descargando PDF de Jordan Digital con Cookie: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/imss/history")
    public ResponseEntity<List<Map<String, Object>>> getImssFilesHistory() {
        List<Map<String, Object>> filesList = new ArrayList<>();
        try {
            Path uploadPath = Paths.get(System.getProperty("user.dir"), "uploads", "imss_semanas");
            if (Files.exists(uploadPath)) {
                try (var stream = Files.list(uploadPath)) {
                    stream.filter(Files::isRegularFile).forEach(path -> {
                        try {
                            String fName = path.getFileName().toString();
                            long fSize = Files.size(path);
                            long lastModified = Files.getLastModifiedTime(path).toMillis();
                            
                            Map<String, Object> fileInfo = new HashMap<>();
                            fileInfo.put("fileName", fName);
                            fileInfo.put("fileSize", fSize);
                            fileInfo.put("updatedAt", lastModified);
                            fileInfo.put("downloadUrl", "/api/v1/admin/imss/download-pdf?file=" + fName);
                            filesList.add(fileInfo);
                        } catch (IOException ignored) {}
                    });
                }
            }
        } catch (Exception e) {
            System.err.println("Error listando historial de semanas IMSS: " + e.getMessage());
        }

        filesList.sort((a, b) -> Long.compare((Long) b.get("updatedAt"), (Long) a.get("updatedAt")));
        return ResponseEntity.ok(filesList);
    }

    private String extractArchivoGenerado(Map<?, ?> respBody) {
        if (respBody == null) return null;

        // Caso 1: Atributo directo "archivo_generado" o "archivo"
        if (respBody.containsKey("archivo_generado") && respBody.get("archivo_generado") != null) {
            return respBody.get("archivo_generado").toString();
        }
        if (respBody.containsKey("archivo") && respBody.get("archivo") != null) {
            return respBody.get("archivo").toString();
        }

        // Caso 2: Objeto cuya clave es el SID (ej. { "49f36166": { "archivo_generado": "RSC_..." } })
        for (Object key : respBody.keySet()) {
            Object value = respBody.get(key);
            if (value instanceof Map) {
                Map<?, ?> innerMap = (Map<?, ?>) value;
                if (innerMap.containsKey("archivo_generado") && innerMap.get("archivo_generado") != null) {
                    return innerMap.get("archivo_generado").toString();
                }
                if (innerMap.containsKey("archivo") && innerMap.get("archivo") != null) {
                    return innerMap.get("archivo").toString();
                }
            }
        }

        // Caso 3: Viene dentro de una lista "data" o "items" o "estados"
        List<?> list = null;
        if (respBody.containsKey("data") && respBody.get("data") instanceof List) {
            list = (List<?>) respBody.get("data");
        } else if (respBody.containsKey("items") && respBody.get("items") instanceof List) {
            list = (List<?>) respBody.get("items");
        } else if (respBody.containsKey("estados") && respBody.get("estados") instanceof List) {
            list = (List<?>) respBody.get("estados");
        }

        if (list != null && !list.isEmpty()) {
            for (Object obj : list) {
                if (obj instanceof Map) {
                    Map<?, ?> map = (Map<?, ?>) obj;
                    if (map.containsKey("archivo_generado") && map.get("archivo_generado") != null) {
                        return map.get("archivo_generado").toString();
                    }
                    if (map.containsKey("archivo") && map.get("archivo") != null) {
                        return map.get("archivo").toString();
                    }
                    if (map.containsKey("url") && map.get("url") != null) {
                        return map.get("url").toString();
                    }
                }
            }
        }
        return null;
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
