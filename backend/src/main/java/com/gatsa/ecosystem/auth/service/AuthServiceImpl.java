package com.gatsa.ecosystem.auth.service;

import com.gatsa.ecosystem.auth.dto.JwtAuthenticationResponse;
import com.gatsa.ecosystem.auth.dto.LoginRequest;
import com.gatsa.ecosystem.auth.dto.RegisterRequest;
import com.gatsa.ecosystem.constant.SecurityConstants;
import com.gatsa.ecosystem.model.User;
import com.gatsa.ecosystem.repository.UserRepository;
import com.gatsa.ecosystem.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Override
    public JwtAuthenticationResponse login(LoginRequest loginRequest) {
        String identifier = loginRequest.getUsername().trim();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        identifier,
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmailIgnoreCase(identifier)
                .orElseGet(() -> userRepository.findByPhone(identifier)
                        .orElseGet(() -> userRepository.findByEmail(identifier)
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con identificador: " + identifier))));

        String jwt = tokenProvider.generateToken(authentication, user.getRole());

        return JwtAuthenticationResponse.builder()
                .accessToken(jwt)
                .tokenType("Bearer")
                .role(user.getRole())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .branch(user.getBranch() != null ? user.getBranch().getCode() : null)
                .build();
    }

    @Override
    @Transactional
    public JwtAuthenticationResponse register(RegisterRequest registerRequest) {
        if (userRepository.existsByPhone(registerRequest.getPhone())) {
            throw new IllegalArgumentException("El número telefónico ya se encuentra registrado.");
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new IllegalArgumentException("El correo electrónico ya se encuentra registrado.");
        }

        String assignedRole = registerRequest.getRole() != null ? registerRequest.getRole() : SecurityConstants.ROLE_CLIENT;
        if (!assignedRole.startsWith("ROLE_")) {
            assignedRole = "ROLE_" + assignedRole;
        }

        User user = User.builder()
                .fullName(registerRequest.getFullName())
                .email(registerRequest.getEmail())
                .phone(registerRequest.getPhone())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(assignedRole)
                .active(true)
                .build();

        userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        registerRequest.getEmail(),
                        registerRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication, user.getRole());

        return JwtAuthenticationResponse.builder()
                .accessToken(jwt)
                .tokenType("Bearer")
                .role(user.getRole())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .build();
    }
}
