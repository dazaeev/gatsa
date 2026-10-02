package com.gatsa.ecosystem.publicsite.controller;

import com.gatsa.ecosystem.constant.SecurityConstants;
import com.gatsa.ecosystem.model.User;
import com.gatsa.ecosystem.portalclient.model.Document;
import com.gatsa.ecosystem.portalclient.repository.DocumentRepository;
import com.gatsa.ecosystem.publicsite.dto.InsuranceQuoteRequest;
import com.gatsa.ecosystem.publicsite.dto.LeadCaptureRequest;
import com.gatsa.ecosystem.publicsite.dto.PostCreateRequest;
import com.gatsa.ecosystem.publicsite.model.Lead;
import com.gatsa.ecosystem.publicsite.model.Post;
import com.gatsa.ecosystem.publicsite.repository.LeadRepository;
import com.gatsa.ecosystem.publicsite.repository.PostRepository;
import com.gatsa.ecosystem.repository.UserRepository;
import com.gatsa.ecosystem.util.EmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/publicsite")
public class PublicSiteController {

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.gatsa.ecosystem.repository.BranchRepository branchRepository;

    @Autowired
    private EmailService emailService;

    @GetMapping("/branches")
    public ResponseEntity<List<Map<String, String>>> getBranches() {
        List<com.gatsa.ecosystem.model.Branch> dbBranches = branchRepository.findByActiveTrue();
        if (dbBranches != null && !dbBranches.isEmpty()) {
            List<Map<String, String>> result = dbBranches.stream().map(b -> Map.of(
                    "id", b.getCode(),
                    "code", b.getCode(),
                    "name", b.getName(),
                    "address", b.getAddress() != null ? b.getAddress() : "",
                    "phone", b.getPhone() != null ? b.getPhone() : "",
                    "whatsapp", b.getPhone() != null ? b.getPhone() : "272 154 6920",
                    "schedule", "Lunes a Viernes: 9:00 AM - 6:00 PM"
            )).toList();
            return ResponseEntity.ok(result);
        }

        return ResponseEntity.ok(List.of(
                Map.of(
                        "id", "ORIZABA_BARRIO_NUEVO",
                        "name", "Sucursal Barrio Nuevo - Orizaba",
                        "address", "Av. Independencia #265, Orizaba, Veracruz",
                        "phone", "(272) 153-3528",
                        "whatsapp", "272 154 6920",
                        "schedule", "Lunes a Viernes: 9:00 AM - 6:00 PM"
                )
        ));
    }

    @GetMapping("/simulator/afore")
    public ResponseEntity<Map<String, Object>> calculateAforeSimulation(@RequestParam double salary, @RequestParam int weeks) {
        Map<String, Object> result = new HashMap<>();
        double estimatedAmount = salary * 4.5 * (weeks / 52.0);
        result.put("salary", salary);
        result.put("weeks", weeks);
        result.put("estimatedRetirementAmount", Math.round(estimatedAmount * 100.0) / 100.0);
        result.put("eligibleForUnemployment", weeks >= 150);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/insurance/quote")
    public ResponseEntity<Map<String, Object>> quoteInsurance(@Valid @RequestBody InsuranceQuoteRequest request) {
        double basePremium = 500.0;
        if ("VIDA".equalsIgnoreCase(request.getInsuranceType())) {
            basePremium = request.getAge() * 25.0 + 800.0;
        } else if ("AUTOS".equalsIgnoreCase(request.getInsuranceType())) {
            basePremium = 4500.0;
        } else if ("GASTOS_MEDICOS".equalsIgnoreCase(request.getInsuranceType())) {
            basePremium = request.getAge() * 85.0 + 3500.0;
        } else if ("PATRIMONIAL".equalsIgnoreCase(request.getInsuranceType())) {
            basePremium = 2800.0;
        }

        // 1. Verificar si el usuario ya tiene documentos subidos
        Map<String, Object> userResult = ensureUserAccountExists(request.getFullName(), request.getPhone(), request.getEmail(), "ORIZABA_BARRIO_NUEVO");
        boolean isExistingUser = (boolean) userResult.getOrDefault("isExistingUser", false);
        User user = (User) userResult.get("user");

        boolean hasDocs = false;
        if (user != null) {
            List<Document> docs = documentRepository.findByUserIdOrderByUploadedAtDesc(user.getId());
            hasDocs = !docs.isEmpty();
        }

        // 2. Guardar como Lead con estatus inteligente
        Lead lead = Lead.builder()
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .branch("ORIZABA_BARRIO_NUEVO")
                .serviceOfInterest("COTIZADOR_SEGUROS_" + request.getInsuranceType())
                .notes("Cotización calculada: $" + basePremium + " MXN para edad: " + request.getAge())
                .status(hasDocs ? "DOCUMENTOS_RECIBIDOS" : "NUEVO")
                .build();
        leadRepository.save(lead);

        // 3. Notificación por Correo
        try {
            emailService.sendInsuranceQuoteEmail(
                    request.getEmail(),
                    request.getFullName(),
                    request.getPhone(),
                    request.getInsuranceType(),
                    request.getAge(),
                    basePremium
            );
        } catch (Exception e) {
            System.err.println("Advertencia SMTP: No se pudo enviar el correo de cotización: " + e.getMessage());
        }

        String msg = isExistingUser
                ? "Cotización generada con éxito. Detectamos que tu cuenta ya cuenta con un expediente en Grupo GATSA. Puedes iniciar sesión con tus credenciales habituales."
                : "Cotización generada con éxito. Un agente de seguros GATSA te contactará. Tu contraseña inicial de portal es tu número de teléfono.";

        return ResponseEntity.ok(Map.of(
                "insuranceType", request.getInsuranceType(),
                "estimatedAnnualPremium", Math.round(basePremium * 100.0) / 100.0,
                "currency", "MXN",
                "isExistingUser", isExistingUser,
                "message", msg
        ));
    }

    @PostMapping("/leads")
    public ResponseEntity<Map<String, Object>> captureLead(@Valid @RequestBody LeadCaptureRequest request) {
        // 1. Verificar o crear la cuenta B2C
        Map<String, Object> userResult = ensureUserAccountExists(request.getFullName(), request.getPhone(), request.getEmail(), request.getBranch());
        boolean isExistingUser = (boolean) userResult.getOrDefault("isExistingUser", false);
        User user = (User) userResult.get("user");

        boolean hasDocs = false;
        if (user != null) {
            List<Document> docs = documentRepository.findByUserIdOrderByUploadedAtDesc(user.getId());
            hasDocs = !docs.isEmpty();
        }

        // 2. Guardar como Lead con estatus inteligente
        Lead lead = Lead.builder()
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .branch(request.getBranch())
                .serviceOfInterest(request.getServiceOfInterest())
                .notes(request.getNotes())
                .status(hasDocs ? "DOCUMENTOS_RECIBIDOS" : "NUEVO")
                .build();

        leadRepository.save(lead);

        // 3. Notificación por Correo
        try {
            emailService.sendLeadNotificationEmail(
                    request.getEmail(),
                    request.getFullName(),
                    request.getPhone(),
                    request.getBranch(),
                    request.getServiceOfInterest(),
                    request.getNotes(),
                    isExistingUser
            );
        } catch (Exception e) {
            System.err.println("Advertencia SMTP: No se pudo enviar notificación por correo: " + e.getMessage());
        }

        String message = isExistingUser
                ? "¡Solicitud registrada exitosamente! Detectamos que tu teléfono o correo ya cuenta con un expediente en Grupo GATSA. Tu contraseña registrada no ha cambiado."
                : "¡Solicitud registrada exitosamente! Tu cuenta ha sido activada en el portal. Tu contraseña inicial son tus 10 dígitos de número telefónico (" + request.getPhone() + ").";

        return ResponseEntity.ok(Map.of(
                "success", true,
                "isExistingUser", isExistingUser,
                "userPhone", request.getPhone().replaceAll("\\D", ""),
                "userEmail", request.getEmail() != null ? request.getEmail() : "",
                "message", message,
                "leadId", lead.getId()
        ));
    }

    private Map<String, Object> ensureUserAccountExists(String fullName, String phone, String email, String branchCode) {
        if (phone == null || phone.isBlank()) return Map.of("isExistingUser", false);
        String cleanPhone = phone.replaceAll("\\D", "");

        User existingUser = userRepository.findByPhone(cleanPhone)
                .orElseGet(() -> (email != null && !email.isBlank()) ? userRepository.findByEmail(email.trim()).orElse(null) : null);

        if (existingUser != null) {
            System.out.println(">>> USUARIO EXISTENTE DETECTADO EN MYSQL - USER ID: " + existingUser.getId() + " <<<");
            Map<String, Object> map = new HashMap<>();
            map.put("isExistingUser", true);
            map.put("user", existingUser);
            return map;
        }

        com.gatsa.ecosystem.model.Branch userBranch = null;
        if (branchCode != null && !branchCode.isBlank()) {
            userBranch = branchRepository.findByCode(branchCode).orElse(null);
        }

        String userEmail = (email != null && !email.isBlank()) ? email.trim() : cleanPhone + "@gatsa.com.mx";
        User newClient = User.builder()
                .fullName(fullName)
                .phone(cleanPhone)
                .email(userEmail)
                .password(passwordEncoder.encode(cleanPhone))
                .role(SecurityConstants.ROLE_CLIENT)
                .branch(userBranch)
                .active(true)
                .build();

        User saved = userRepository.save(newClient);
        System.out.println(">>> NUEVA CUENTA B2C CREADA EN MYSQL - USER ID: " + saved.getId() + " | Nombre: " + saved.getFullName() + " <<<");

        Map<String, Object> map = new HashMap<>();
        map.put("isExistingUser", false);
        map.put("user", saved);
        return map;
    }

    @GetMapping("/leads")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Lead>> getAllLeads() {
        return ResponseEntity.ok(leadRepository.findAll());
    }

    @GetMapping("/posts")
    public ResponseEntity<List<Post>> getPublicPosts() {
        return ResponseEntity.ok(postRepository.findByPublishedTrueOrderByCreatedAtDesc());
    }

    @PostMapping("/posts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Post> createPost(@Valid @RequestBody PostCreateRequest request) {
        Post post = Post.builder()
                .title(request.getTitle())
                .category(request.getCategory())
                .content(request.getContent())
                .imageBase64(request.getImageBase64())
                .imageUrl(request.getImageUrl())
                .published(true)
                .build();

        return ResponseEntity.ok(postRepository.save(post));
    }
}
