package com.gatsa.ecosystem.security;

import com.gatsa.ecosystem.model.User;
import com.gatsa.ecosystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

/**
 * Servicio para cargar detalles del usuario por Correo Electrónico o Teléfono en Spring Security.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String emailOrPhone) throws UsernameNotFoundException {
        String cleanIdentifier = emailOrPhone != null ? emailOrPhone.trim() : "";
        User user = userRepository.findByEmailIgnoreCase(cleanIdentifier)
                .orElseGet(() -> userRepository.findByPhone(cleanIdentifier)
                        .orElseGet(() -> userRepository.findByEmail(cleanIdentifier)
                                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con correo o teléfono: " + emailOrPhone))));

        String assignedRole = user.getRole();
        if (assignedRole != null && !assignedRole.startsWith("ROLE_")) {
            assignedRole = "ROLE_" + assignedRole;
        }

        return new org.springframework.security.core.userdetails.User(
                emailOrPhone, // Mantiene el identificador ingresado por el usuario (email o teléfono)
                user.getPassword(),
                user.getActive(),
                true,
                true,
                true,
                Collections.singletonList(new SimpleGrantedAuthority(assignedRole))
        );
    }
}
