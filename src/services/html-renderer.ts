// src/services/html-renderer.ts

import Handlebars from 'handlebars';
import { BODY_SKELETON } from '@/lib/html-renderer/templates';
import { STATIC_HEAD, STATIC_SCRIPTS } from '@/lib/html-renderer/constants';
import { LandingCopy } from '@/types/landing';

Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

/**
 * Ensambladora Híbrida V1.2
 * Compila el HTML de forma determinista usando el JSON estricto.
 * Tiempo estimado: < 5ms. Costo de tokens: $0.
 */
export function renderLandingPage(copyData: LandingCopy): string {
  try {
    // 1. Compilar el esqueleto con Handlebars
    const template = Handlebars.compile(BODY_SKELETON);

    // 2. Inyectar los datos del JSON en el HTML
    // Handlebars automáticamente itera los {{#each}} y reemplaza las variables
    const bodyHtml = template(copyData);

    // 3. Validar que no hayan quedado placeholders sin llenar
    if (bodyHtml.includes('{{') || bodyHtml.includes('}}')) {
      console.warn('Render Renderer: Algunos placeholders no se llenaron correctamente.');
    }

    // 4. Armar el "sánguche" definitivo
    const finalHtml = `
      <!DOCTYPE html>
      <html lang="es">
      ${STATIC_HEAD}
      ${bodyHtml}
      ${STATIC_SCRIPTS}
      </html>
    `;

    return finalHtml;

  } catch (error) {
    console.error('Error en el Motor de Renderizado:', error);
    throw new Error('Falló el ensamblaje del HTML.');
  }
}