package com.gatsa.ecosystem.admin.controller;

import com.gatsa.ecosystem.model.Branch;
import com.gatsa.ecosystem.model.User;
import com.gatsa.ecosystem.repository.BranchRepository;
import com.gatsa.ecosystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/team")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'GERENTE_SUCURSAL', 'ADMIN')")
public class TeamController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getTeamMembers(Authentication auth) {
        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseGet(() -> userRepository.findByPhone(auth.getName()).orElse(null));

        List<User> users;
        boolean isSuper = currentUser != null && ("ROLE_SUPER_ADMIN".equalsIgnoreCase(currentUser.getRole()) || "ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole()));

        if (isSuper) {
            users = userRepository.findAll();
        } else if (currentUser != null && currentUser.getBranch() != null) {
            users = userRepository.findAll().stream()
                    .filter(u -> u.getBranch() != null && u.getBranch().getId().equals(currentUser.getBranch().getId()))
                    .collect(Collectors.toList());
        } else {
            users = List.of();
        }

        List<Map<String, Object>> result = users.stream()
                .filter(u -> !u.getRole().equalsIgnoreCase("ROLE_CLIENT"))
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", u.getId());
                    map.put("fullName", u.getFullName());
                    map.put("phone", u.getPhone());
                    map.put("email", u.getEmail());
                    map.put("role", u.getRole());
                    map.put("active", u.getActive());
                    map.put("branchName", u.getBranch() != null ? u.getBranch().getName() : "Sin Sucursal (Matriz)");
                    map.put("branchCode", u.getBranch() != null ? u.getBranch().getCode() : "MATRIZ");
                    return map;
                }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createTeamMember(@RequestBody Map<String, String> body, Authentication auth) {
        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseGet(() -> userRepository.findByPhone(auth.getName()).orElse(null));

        String fullName = body.get("fullName");
        String phone = body.get("phone");
        String email = body.get("email");
        String password = body.get("password");
        String role = body.get("role");
        String branchCode = body.get("branchCode");

        if (fullName == null || phone == null || email == null || password == null || role == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Todos los campos obligatorios deben completarse."));
        }

        boolean isSuper = currentUser != null && ("ROLE_SUPER_ADMIN".equalsIgnoreCase(currentUser.getRole()) || "ROLE_ADMIN".equalsIgnoreCase(currentUser.getRole()));

        // Si es Gerente o Agente, la sucursal asignada DEBE SER OBLIGATORIAMENTE la suya propia.
        // Si es Super Admin, puede elegir la sucursal del parámetro branchCode.
        Branch branch = null;
        if (isSuper) {
            if (branchCode != null && !branchCode.isBlank()) {
                branch = branchRepository.findByCode(branchCode.trim().toUpperCase()).orElse(null);
            }
        } else if (currentUser != null) {
            branch = currentUser.getBranch();
        }

        User newUser = User.builder()
                .fullName(fullName.trim())
                .phone(phone.trim())
                .email(email.trim().toLowerCase())
                .password(passwordEncoder.encode(password))
                .role(role.trim().toUpperCase())
                .branch(branch)
                .active(true)
                .build();

        userRepository.save(newUser);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "¡Empleado/Colaborador '" + newUser.getFullName() + "' registrado correctamente con rol " + newUser.getRole() + "!",
                "userId", newUser.getId()
        ));
    }
}
