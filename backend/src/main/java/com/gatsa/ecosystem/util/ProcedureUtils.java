package com.gatsa.ecosystem.util;

import java.time.Year;

public final class ProcedureUtils {

    private ProcedureUtils() {
        // Prevent instantiation
    }

    public static final String PREFIX = "GATSA-";
    public static final int BASE_OFFSET = 1000;

    /**
     * Genera un folio dinámico basado en el año actual y el ID de la solicitud.
     * Ejemplo para el ID 27 en el año 2026: GATSA-2026-1027
     */
    public static String generateProcedureId(Long leadId) {
        if (leadId == null) {
            leadId = 1L;
        }
        int currentYear = Year.now().getValue();
        return PREFIX + currentYear + "-" + (BASE_OFFSET + leadId);
    }

    /**
     * Limpia la cadena de búsqueda removiendo prefijos de folio conocidos (ej. "GATSA-", "2026-", "GATSA-2026-")
     */
    public static String cleanSearchTerm(String search) {
        if (search == null || search.isBlank()) {
            return "";
        }
        return search.trim()
                     .replaceAll("(?i)^GATSA-\\d{4}-", "")
                     .replaceAll("(?i)^GATSA-", "")
                     .trim();
    }

    /**
     * Extrae el ID numérico real de la base de datos a partir de una cadena o folio.
     * Ejemplo: "1027" o "GATSA-2026-1027" -> 27L
     * Si no es un número de folio mayor a BASE_OFFSET, retorna null.
     */
    public static Long parseLeadIdFromSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        String clean = cleanSearchTerm(search);
        if (clean.matches("^\\d+$")) {
            try {
                long val = Long.parseLong(clean);
                if (val > BASE_OFFSET) {
                    return val - BASE_OFFSET;
                } else {
                    return val;
                }
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }
}
