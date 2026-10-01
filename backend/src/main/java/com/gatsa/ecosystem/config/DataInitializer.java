package com.gatsa.ecosystem.config;

import com.gatsa.ecosystem.b2bpartner.model.PartnerWallet;
import com.gatsa.ecosystem.b2bpartner.repository.PartnerWalletRepository;
import com.gatsa.ecosystem.config.model.SystemConfiguration;
import com.gatsa.ecosystem.config.repository.SystemConfigurationRepository;
import com.gatsa.ecosystem.constant.SecurityConstants;
import com.gatsa.ecosystem.model.User;
import com.gatsa.ecosystem.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository, 
                                           PartnerWalletRepository partnerWalletRepository,
                                           SystemConfigurationRepository configRepository,
                                           PasswordEncoder passwordEncoder) {
        return args -> {
            // Inicializar configuraciones del sistema en BD
            if (configRepository.count() == 0) {
                configRepository.save(SystemConfiguration.builder()
                        .configKey("ADMIN_NOTIFICATION_EMAIL")
                        .configValue("ing.dazaeev@gmail.com")
                        .description("Correo corporativo donde el Administrador/Agentes reciben notificaciones y alertas operativas")
                        .build());

                configRepository.save(SystemConfiguration.builder()
                        .configKey("ENABLE_EMAIL_NOTIFICATIONS")
                        .configValue("true")
                        .description("Habilita o deshabilita el envío dinámico de correos electrónicos en la plataforma")
                        .build());

                configRepository.save(SystemConfiguration.builder()
                        .configKey("MAIN_BRANCH_PHONE")
                        .configValue("2721546920")
                        .description("Teléfono WhatsApp de la Sucursal Barrio Nuevo Orizaba")
                        .build());

                System.out.println(">>> Configuraciones del Sistema sembradas exitosamente en MySQL <<<");
            }

            if (userRepository.count() == 0) {
                // Cliente demo
                User client = userRepository.save(User.builder()
                        .fullName("Juan Carlos Pérez")
                        .email("cliente@gatsa.com.mx")
                        .phone("2721234567")
                        .password(passwordEncoder.encode("Cliente2026!"))
                        .role(SecurityConstants.ROLE_CLIENT)
                        .active(true)
                        .build());

                // Socio B2B demo
                User partner = userRepository.save(User.builder()
                        .fullName("Papelería del Centro Orizaba")
                        .email("socio@gatsa.com.mx")
                        .phone("2739876543")
                        .password(passwordEncoder.encode("Socio2026!"))
                        .role(SecurityConstants.ROLE_PARTNER)
                        .active(true)
                        .build());

                // Monedero B2B inicial
                partnerWalletRepository.save(PartnerWallet.builder()
                        .partner(partner)
                        .balance(new BigDecimal("4850.00"))
                        .creditLimit(new BigDecimal("10000.00"))
                        .issuedFoliosCount(142)
                        .build());

                // Administrador demo
                userRepository.save(User.builder()
                        .fullName("Administrador Corporativo GATSA")
                        .email("admin@gatsa.com.mx")
                        .phone("2720000000")
                        .password(passwordEncoder.encode("AdminGatsa2026!"))
                        .role(SecurityConstants.ROLE_ADMIN)
                        .active(true)
                        .build());

                System.out.println("=========================================================");
                System.out.println(">>> Base de Datos MySQL GATSA inicializada con éxito <<<");
                System.out.println("Cliente: cliente@gatsa.com.mx (2721234567) / Cliente2026!");
                System.out.println("Socio B2B: socio@gatsa.com.mx (2739876543) / Socio2026!");
                System.out.println("Admin: admin@gatsa.com.mx (2720000000) / AdminGatsa2026!");
                System.out.println("=========================================================");
            }
        };
    }
}
