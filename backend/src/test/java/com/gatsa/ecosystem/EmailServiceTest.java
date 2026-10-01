package com.gatsa.ecosystem;

import com.gatsa.ecosystem.util.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
public class EmailServiceTest {

    @Autowired
    private EmailService emailService;

    @Test
    public void testEmailServiceInjected() {
        assertNotNull(emailService, "El servicio EmailService debe inyectarse correctamente.");
    }

    /**
     * Test de prueba directa de envío de correo SMTP contra el servidor de Gmail.
     * Deshabilitado por defecto para evitar envíos automáticos repetitivos en builds.
     */
    @Test
    public void testSendInsuranceQuoteEmail() {
        emailService.sendInsuranceQuoteEmail(
                "ing.dazaeev@gmail.com",
                "Ing. Dazaev Test",
                "2721533528",
                "VIDA",
                35,
                1800.00
        );
    }
}
