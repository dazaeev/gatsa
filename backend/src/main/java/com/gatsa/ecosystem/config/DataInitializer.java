package com.gatsa.ecosystem.config;

import com.gatsa.ecosystem.b2bpartner.model.PartnerWallet;
import com.gatsa.ecosystem.b2bpartner.repository.PartnerWalletRepository;
import com.gatsa.ecosystem.config.model.SystemConfiguration;
import com.gatsa.ecosystem.config.repository.SystemConfigurationRepository;
import com.gatsa.ecosystem.constant.SecurityConstants;
import com.gatsa.ecosystem.model.Branch;
import com.gatsa.ecosystem.model.User;
import com.gatsa.ecosystem.repository.BranchRepository;
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
                                           BranchRepository branchRepository,
                                           PartnerWalletRepository partnerWalletRepository,
                                           SystemConfigurationRepository configRepository,
                                           PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Inicializar sucursales por defecto
            if (branchRepository.count() == 0) {
                Branch b1 = branchRepository.save(Branch.builder()
                        .code("ORIZABA_BARRIO_NUEVO")
                        .name("Sucursal Barrio Nuevo - Orizaba")
                        .address("Av. Independencia #265")
                        .phone("2721546920")
                        .active(true)
                        .build());

                Branch b2 = branchRepository.save(Branch.builder()
                        .code("ORIZABA_CENTRO")
                        .name("Centro Corporativo - Orizaba")
                        .address("Calle Real #100")
                        .phone("2721000000")
                        .active(true)
                        .build());

                Branch b3 = branchRepository.save(Branch.builder()
                        .code("HUATUSCO_CENTRO")
                        .name("Sucursal Huatusco")
                        .address("Av. 1 #300")
                        .phone("2731000000")
                        .active(true)
                        .build());

                System.out.println(">>> Sucursales iniciales de GATSA sembradas en MySQL <<<");
            }

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
                Branch barrioNuevo = branchRepository.findByCode("ORIZABA_BARRIO_NUEVO").orElse(null);

                // Único Admin Semilla Inicial para poder acceder al sistema
                userRepository.save(User.builder()
                        .fullName("Administrador Corporativo GATSA")
                        .email("admin@gatsa.com.mx")
                        .phone("2720000000")
                        .password(passwordEncoder.encode("AdminGatsa2026!"))
                        .role("ROLE_SUPER_ADMIN")
                        .active(true)
                        .build());

                // Cliente demo
                userRepository.save(User.builder()
                        .fullName("Juan Carlos Pérez")
                        .email("cliente@gatsa.com.mx")
                        .phone("2721234567")
                        .password(passwordEncoder.encode("Cliente2026!"))
                        .role(SecurityConstants.ROLE_CLIENT)
                        .branch(barrioNuevo)
                        .active(true)
                        .build());

                System.out.println("=========================================================");
                System.out.println(">>> Base de Datos MySQL GATSA inicializada con éxito <<<");
                System.out.println("Admin Semilla: admin@gatsa.com.mx (2720000000) / AdminGatsa2026!");
                System.out.println("=========================================================");
            }
        };
    }
}
