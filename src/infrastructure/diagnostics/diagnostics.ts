import type { DiagnosticFields } from '../../domain/diagnostics/clientLog.js';

let record: ((event: string, fields: DiagnosticFields) => void) | null = null;
export function diagnostic(event: string, fields: DiagnosticFields = {}) {
  record?.(event, fields);
}
export function setDiagnosticRecorder(recorder: (event: string, fields: DiagnosticFields) => void) {
  record = recorder;
}
