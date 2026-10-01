export const PROCEDURE_PREFIX = 'GATSA-';
export const BASE_OFFSET = 1000;

export function formatProcedureId(leadId: number): string {
  const currentYear = new Date().getFullYear();
  return `${PROCEDURE_PREFIX}${currentYear}-${BASE_OFFSET + (leadId || 1)}`;
}
