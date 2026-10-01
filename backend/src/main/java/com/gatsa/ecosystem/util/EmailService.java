package com.gatsa.ecosystem.util;

import com.gatsa.ecosystem.config.model.SystemConfiguration;
import com.gatsa.ecosystem.config.repository.SystemConfigurationRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Arrays;

/**
 * Servicio de Notificaciones por Correo Electrónico Corporativo GATSA.
 * Envía copia (CC) automática a los administradores en BD para auditoría operativa.
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private SystemConfigurationRepository configRepository;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.mail.admin-notification-email:ing.dazaeev@gmail.com}")
    private String defaultAdminEmail;

    public String getAdminEmailRaw() {
        return configRepository.findByConfigKey("ADMIN_NOTIFICATION_EMAIL")
                .map(SystemConfiguration::getConfigValue)
                .orElse(defaultAdminEmail);
    }

    private String[] parseAdminEmails() {
        String raw = getAdminEmailRaw();
        if (raw == null || raw.isBlank()) {
            return new String[]{defaultAdminEmail};
        }
        return Arrays.stream(raw.split("[,;]"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toArray(String[]::new);
    }

    private String getLogoSvgHtml() {
        return """
            <div style="text-align: center; padding: 10px 0;">
                <svg viewBox="0 0 320 120" width="220" height="80" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 70 L55 50 L75 58 L105 30 L135 68 L160 48 L185 65 L220 20 L250 65" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M35 60 L55 50 M90 45 L105 30 M145 58 L160 48 M195 40 L220 20" stroke="#0072CE" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                    <rect x="165" y="42" width="10" height="28" rx="1.5" fill="#ffffff" />
                    <rect x="180" y="32" width="10" height="38" rx="1.5" fill="#ffffff" />
                    <rect x="195" y="20" width="10" height="50" rx="1.5" fill="#ffffff" />
                    <path d="M160 62 C 180 58, 200 40, 215 12" stroke="#0072CE" stroke-width="3.5" fill="none" stroke-linecap="round"/>
                    <text x="160" y="98" text-anchor="middle" fill="#ffffff" font-family="'Segoe UI', Arial, sans-serif" font-weight="900" font-size="28" letter-spacing="2">GATSA</text>
                    <text x="160" y="112" text-anchor="middle" fill="#0072CE" font-family="'Segoe UI', Arial, sans-serif" font-weight="700" font-size="8.5" letter-spacing="3">ASESORÍA PATRIMONIAL</text>
                </svg>
            </div>
            """;
    }

    /**
     * Envía notificación con Dictamen al Cliente y copia CC obligatoria a los Administradores en BD.
     */
    @Async
    public void sendStatusChangedNotificationWithDictamen(String clientEmail, String clientName, String procedureId, String service, String newStatus, String adminNote, String attachmentFileName) {
        if (mailSender == null) return;

        try {
            String[] adminRecipients = parseAdminEmails();
            String primaryRecipient = (clientEmail != null && !clientEmail.isBlank()) ? clientEmail : adminRecipients[0];

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(primaryRecipient);

            // Copia CC obligatoria al Administrador/Agentes de GATSA para auditoría
            if (adminRecipients.length > 0) {
                helper.setCc(adminRecipients);
            }

            helper.setSubject("Dictamen y Actualización de Trámite: " + procedureId + " - Grupo GATSA");

            String noteBlockHtml = (adminNote != null && !adminNote.isBlank())
                    ? """
                      <div style="background-color: #fffbe3; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 13px; color: #78350f;">
                          <strong>Mensaje de tu Asesor GATSA:</strong><br>
                          "%s"
                      </div>
                      """.formatted(adminNote)
                    : "";

            String attachmentBlockHtml = (attachmentFileName != null && !attachmentFileName.isBlank())
                    ? """
                      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 12px; color: #166534;">
                          <strong>Documento Entregable Adjunto:</strong> %s<br>
                          <em>(Puedes consultar y descargar este documento oficial desde tu portal privado GATSA).</em>
                      </div>
                      """.formatted(attachmentFileName)
                    : "";

            String htmlBody = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
                    <div style="max-width: 600px; background: #ffffff; margin: 0 auto; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
                        <div style="background: linear-gradient(135deg, #0F2C59 0%%, #0B192C 100%%); padding: 24px; text-align: center; border-bottom: 4px solid #0072CE;">
                            %s
                        </div>
                        <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
                            <h3 style="color: #0F2C59; margin-top: 0; font-size: 20px;">Dictamen de Avance de Trámite</h3>
                            <p>Estimado(a) <strong>%s</strong>,</p>
                            <p>Te informamos que tu expediente <strong>%s</strong> para el servicio <strong>%s</strong> ha sido dictaminado con éxito.</p>
                            
                            <div style="background-color: #f0f9ff; border: 2px solid #0072CE; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                                <div style="font-size: 12px; color: #0369a1; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Estatus Actualizado en Sistema</div>
                                <div style="font-size: 22px; font-weight: 900; color: #0072CE; margin-top: 6px;">%s</div>
                            </div>

                            %s
                            %s

                            <p style="font-size: 13px; color: #64748b;">Puedes consultar el detalle completo de la línea de tiempo e ingresar documentos desde tu portal privado.</p>
                            <div style="text-align: center; margin-top: 24px;">
                                <a href="http://localhost:3000/portal-cliente" style="background-color: #0072CE; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 24px; border-radius: 8px; font-size: 13px;">Ingresar a Mi Expediente</a>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(getLogoSvgHtml(), clientName, procedureId, service, newStatus, noteBlockHtml, attachmentBlockHtml);

            helper.setText(htmlBody, true);
            mailSender.send(message);
            logger.info(">>> NOTIFICACIÓN CON DICTAMEN ENVIADA A CLIENTE: {} (CC ADMIN: {}) <<<", primaryRecipient, String.join(", ", adminRecipients));
        } catch (Exception e) {
            logger.error("Error enviando notificación de dictamen: ", e);
        }
    }

    /**
     * Envía confirmación de solicitud al cliente e instruye sus credenciales intuitivas de acceso al portal.
     */
    @Async
    public void sendLeadNotificationEmail(String clientEmail, String clientName, String clientPhone, String branch, String service, String notes, boolean isExistingUser) {
        if (mailSender == null) return;

        try {
            String[] adminRecipients = parseAdminEmails();
            String primaryRecipient = (clientEmail != null && !clientEmail.isBlank()) ? clientEmail : adminRecipients[0];

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(primaryRecipient);

            if (adminRecipients.length > 0) {
                helper.setCc(adminRecipients);
            }

            helper.setSubject("Solicitud Registrada - Grupo GATSA");

            String cleanPhone = clientPhone != null ? clientPhone.replaceAll("\\D", "") : "";

            String accessBoxHtml;
            if (isExistingUser) {
                accessBoxHtml = """
                    <div style="background-color: #f0fdf4; border: 2px solid #16a34a; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                        <div style="font-size: 12px; color: #166534; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">TU CUENTA YA SE ENCUENTRA ACTIVA EN GATSA</div>
                        <p style="font-size: 13px; color: #334155; margin: 10px 0 6px 0;">Hemos vinculado esta nueva solicitud a tu expediente existente:</p>
                        <div style="font-size: 13px; color: #0f172a; margin-bottom: 6px;"><strong>Usuario:</strong> %s</div>
                        <div style="font-size: 12px; color: #16a34a; font-weight: 700;"><strong>Contraseña:</strong> Tu contraseña registrada previamente</div>
                        <p style="font-size: 11px; color: #64748b; margin-top: 6px;">Tu contraseña original se mantiene segura y no ha sido modificada.</p>
                        <a href="http://localhost:3000/login?type=client" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 24px; border-radius: 8px; font-size: 13px; margin-top: 12px;">Ingresar a Mi Expediente</a>
                    </div>
                    """.formatted((clientEmail != null && !clientEmail.isBlank()) ? clientEmail : cleanPhone);
            } else {
                accessBoxHtml = """
                    <div style="background-color: #f0f9ff; border: 2px solid #0072CE; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                        <div style="font-size: 12px; color: #0369a1; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">ACCESO A TU PORTAL SEGURO GATSA</div>
                        <p style="font-size: 13px; color: #334155; margin: 10px 0 4px 0;">Hemos activado tu cuenta para consultar el estatus de tu expediente:</p>
                        <div style="font-size: 13px; color: #0f172a; margin-bottom: 6px;"><strong>Usuario:</strong> %s (o tu teléfono)</div>
                        <div style="font-size: 13px; color: #0072CE; font-weight: 800;"><strong>Contraseña Inicial:</strong> %s</div>
                        <p style="font-size: 11px; color: #64748b; margin-top: 4px;">(Tus 10 dígitos de número telefónico)</p>
                        <a href="http://localhost:3000/login?type=client" style="display: inline-block; background-color: #0072CE; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 24px; border-radius: 8px; font-size: 13px; margin-top: 12px;">Ingresar a Mi Expediente</a>
                    </div>
                    """.formatted((clientEmail != null && !clientEmail.isBlank()) ? clientEmail : cleanPhone, cleanPhone);
            }

            String htmlBody = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
                        .container { max-width: 600px; background: #ffffff; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
                        .header { background: linear-gradient(135deg, #0F2C59 0%%, #0B192C 100%%); padding: 24px; text-align: center; border-bottom: 4px solid #0072CE; }
                        .content { padding: 32px; line-height: 1.6; }
                        .card { background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin: 20px 0; }
                        .footer { background-color: #0F2C59; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5; }
                        .badge { display: inline-block; background-color: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 9999px; font-weight: 700; font-size: 12px; border: 1px solid #bae6fd; }
                        .phone-highlight { font-size: 16px; font-weight: 800; color: #0072CE; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            %s
                        </div>
                        <div class="content">
                            <h2 style="color: #0F2C59; margin-top: 0; font-size: 20px;">¡Gracias por contactar a Grupo GATSA!</h2>
                            <p>Estimado(a) <strong>%s</strong>,</p>
                            <p>Hemos recibido correctamente tu solicitud de orientación. Un asesor especializado dará seguimiento a tu trámite.</p>
                            
                            <div class="card">
                                <div style="font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">DATOS DE TU SOLICITUD</div>
                                <div style="margin-bottom: 8px;"><strong>Servicio de Interés:</strong> <span class="badge">%s</span></div>
                                <div style="margin-bottom: 8px;"><strong>Sucursal Asignada:</strong> %s</div>
                                <div><strong>Teléfono de Contacto:</strong> <span class="phone-highlight">%s</span></div>
                            </div>

                            %s
                        </div>
                        <div class="footer">
                            <strong>Grupo GATSA S.A. de C.V.</strong><br>
                            Sucursal Barrio Nuevo Orizaba: Av. Independencia #265, Col. Barrio Nuevo, Orizaba, Veracruz.<br>
                            Línea AFORE Directa: 272 154 6920 | Tel: (272) 153-3528
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                        getLogoSvgHtml(),
                        clientName,
                        service,
                        branch,
                        clientPhone,
                        accessBoxHtml
                );

            helper.setText(htmlBody, true);
            mailSender.send(message);
            logger.info(">>> CORREO DE LEAD ENVIADO EXITOSAMENTE a: {} (CC: {}) <<<", primaryRecipient, String.join(", ", adminRecipients));
        } catch (Exception e) {
            logger.error("!!! ERROR AL ENVIAR CORREO ELECTRONICO DE LEAD !!!: ", e);
        }
    }

    /**
     * Envía correo al cliente confirmando la recepción del documento + envío independiente a todos los Administradores configurados en BD.
     */
    @Async
    public void sendDocumentUploadedNotifications(String clientEmail, String clientName, String clientPhone, String docType, String fileName, String procedureId) {
        if (mailSender == null) return;

        String[] adminRecipients = parseAdminEmails();

        if (clientEmail != null && !clientEmail.isBlank()) {
            try {
                MimeMessage msg = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
                helper.setFrom(fromEmail);
                helper.setTo(clientEmail);
                helper.setSubject("Documento Recibido - Expediente Digital " + procedureId + " - Grupo GATSA");

                String htmlClient = """
                    <!DOCTYPE html>
                    <html>
                    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
                        <div style="max-width: 600px; background: #ffffff; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
                            <div style="background: #0F2C59; padding: 20px; text-align: center; color: white;">
                                %s
                            </div>
                            <div style="padding: 25px; color: #1e293b; line-height: 1.6;">
                                <h3 style="color: #0F2C59; margin-top: 0;">¡Documento Adjuntado Correctamente!</h3>
                                <p>Estimado(a) <strong>%s</strong>,</p>
                                <p>Confirmamos la recepción del documento <strong>%s</strong> (<em>%s</em>) en tu expediente <strong>%s</strong>.</p>
                                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                    <strong style="color: #15803d;">Estatus Actual:</strong> Tu trámite ha avanzado a la fase de <strong>Validación de Expediente</strong>.
                                </div>
                                <p style="font-size: 12px; color: #64748b;">Un ejecutivo revisará la legibilidad de tu archivo. Puedes consultar el avance en tiempo real desde tu portal.</p>
                                <div style="text-align: center; margin-top: 20px;">
                                    <a href="http://localhost:3000/portal-cliente" style="background: #0072CE; color: white; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 12px;">Consultar Mi Expediente</a>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                    """.formatted(getLogoSvgHtml(), clientName, docType, fileName, procedureId);

                helper.setText(htmlClient, true);
                mailSender.send(msg);
                logger.info(">>> CORREO DE CONFIRMACIÓN DE DOCUMENTO ENVIADO AL CLIENTE: {} <<<", clientEmail);
            } catch (Exception e) {
                logger.error("Error enviando correo de documento al cliente: ", e);
            }
        }

        if (adminRecipients.length > 0) {
            try {
                MimeMessage adminMsg = mailSender.createMimeMessage();
                MimeMessageHelper adminHelper = new MimeMessageHelper(adminMsg, true, "UTF-8");
                adminHelper.setFrom(fromEmail);
                adminHelper.setTo(adminRecipients);
                adminHelper.setSubject("ALERTA OPERATIVA GATSA: Nuevo Documento Cargado por " + clientName + " (" + procedureId + ")");

                String htmlAdmin = """
                    <!DOCTYPE html>
                    <html>
                    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
                        <div style="max-width: 600px; background: #ffffff; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
                            <div style="background: #0F2C59; padding: 20px; text-align: center; color: white;">
                                %s
                            </div>
                            <div style="padding: 25px; color: #1e293b; line-height: 1.6;">
                                <h3 style="color: #0072CE; margin-top: 0;">ALERTA OPERATIVA: DOCUMENTO PENDIENTE DE VALIDACIÓN</h3>
                                <p>Atención Agente Corporativo GATSA,</p>
                                <p>El cliente <strong>%s</strong> ha adjuntado un nuevo documento a su expediente digital.</p>
                                <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 13px;">
                                    <div><strong>Folio:</strong> %s</div>
                                    <div><strong>Cliente:</strong> %s</div>
                                    <div><strong>Teléfono:</strong> %s</div>
                                    <div><strong>Documento:</strong> %s (<em>%s</em>)</div>
                                </div>
                                <p style="font-size: 12px; color: #475569;">Ingresa al Panel Administrador para revisar el archivo físico, dictaminar la legibilidad y avanzar la fase CONSAR.</p>
                                <div style="text-align: center; margin-top: 20px;">
                                    <a href="http://localhost:3000/admin-dashboard" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 13px;">Abrir Panel de Administración GATSA</a>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                    """.formatted(getLogoSvgHtml(), clientName, procedureId, clientName, clientPhone, docType, fileName);

                adminHelper.setText(htmlAdmin, true);
                mailSender.send(adminMsg);
                logger.info(">>> ALERTA DE DOCUMENTO ENVIADA A LOS ADMINISTRADORES EN BD: {} <<<", String.join(", ", adminRecipients));
            } catch (Exception e) {
                logger.error("Error enviando alerta de documento al administrador: ", e);
            }
        }
    }

    /**
     * Envía desglose de Cotización de Seguro e instrucciones de acceso.
     */
    @Async
    public void sendInsuranceQuoteEmail(String clientEmail, String clientName, String clientPhone, String insuranceType, int age, double estimatedPremium) {
        if (mailSender == null) return;

        try {
            String[] adminRecipients = parseAdminEmails();
            String primaryRecipient = (clientEmail != null && !clientEmail.isBlank()) ? clientEmail : adminRecipients[0];

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(primaryRecipient);
            if (adminRecipients.length > 0) {
                helper.setCc(adminRecipients);
            }
            helper.setSubject("Cotización Oficial: Seguro de " + insuranceType + " - " + clientName + " - Grupo GATSA");

            String cleanPhone = clientPhone != null ? clientPhone.replaceAll("\\D", "") : "";

            String htmlBody = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
                        .container { max-width: 600px; background: #ffffff; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
                        .header { background: linear-gradient(135deg, #0F2C59 0%%, #0B192C 100%%); padding: 24px; text-align: center; border-bottom: 4px solid #0072CE; }
                        .content { padding: 32px; line-height: 1.6; }
                        .price-box { background-color: #f0fdf4; border: 2px dashed #16a34a; padding: 24px; text-align: center; border-radius: 12px; margin: 24px 0; }
                        .amount { font-size: 32px; font-weight: 900; color: #15803d; margin: 8px 0; }
                        .footer { background-color: #0F2C59; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5; }
                        .btn { display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 24px; border-radius: 8px; font-size: 13px; margin-top: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            %s
                        </div>
                        <div class="content">
                            <p>Estimado(a) <strong>%s</strong>,</p>
                            <p>Hemos generado la estimación preliminar para tu póliza de <strong>Seguro de %s</strong>.</p>
                            
                            <div class="price-box">
                                <div style="font-size: 12px; color: #166534; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Prima Anual Estimada desde</div>
                                <div class="amount">$%s MXN</div>
                                <div style="font-size: 12px; color: #15803d; font-weight: 700;">Teléfono del Cliente: %s | Edad: %d años</div>
                            </div>

                            <p>Tu cuenta se encuentra activa en el portal. Puedes ingresar con tu usuario y contraseña registrada.</p>
                            
                            <div style="text-align: center; margin-top: 24px;">
                                <a href="http://localhost:3000/login?type=client" class="btn">Ingresar al Portal GATSA</a>
                            </div>
                        </div>
                        <div class="footer">
                            <strong>Grupo GATSA S.A. de C.V.</strong> | Asesoría Patrimonial & Previsión Social.<br>
                            Sucursal Barrio Nuevo Orizaba: Av. Independencia #265 | Tel: (272) 153-3528
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                        getLogoSvgHtml(),
                        clientName,
                        insuranceType,
                        String.format("%,.2f", estimatedPremium),
                        clientPhone,
                        age
                );

            helper.setText(htmlBody, true);
            mailSender.send(message);
            logger.info(">>> CORREO DE COTIZACIÓN ENVIADO EXITOSAMENTE a: {} (CC: {}) <<<", primaryRecipient, String.join(", ", adminRecipients));
        } catch (Exception e) {
            logger.error("Error enviando correo de cotización: ", e);
        }
    }
}
