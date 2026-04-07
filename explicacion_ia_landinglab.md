# Funcionamiento de la IA y Generación en LandingLab (Motor V1.1)

Este documento explica en detalle y paso a paso cómo LandingLab utiliza la Inteligencia Artificial (mediante la API de OpenAI) para guiar al usuario durante la creación de un proyecto, extraer la información, pensar la estrategia, redactar el Copy persuasivo y finalmente ensamblar todo en un archivo HTML funcional usando nuestro Motor de Renderizado Híbrido (V1.1).

A lo largo del proceso se utilizan dos modelos lingüísticos distintos para optimizar velocidad y calidad:
- **`gpt-4o-mini`**: Utilizado para extracciones de información de respuestas del usuario y clasificaciones simples de categorías.
- **`gpt-4o`**: Utilizado para la creación de estrategias persuasivas, la redacción creativa del Copy y finalmente la inyección de datos orgánicos en el código HTML.

---

## El Flujo Completo: Paso a Paso

Todo el proceso comienza desde el momento en que se crea el proyecto y el usuario ingresa a la vista del chat en la plataforma.

### 1. Inicialización de la Vista y del Chat
**Archivos consultados/utilizados:**
- `src/app/project/[id]/page.tsx` *(Frontend)*
- `src/store/project-store.ts` *(Manejo de estado Global - Zustand)*
- `src/types/chat.ts` *(Definiciones y listado de preguntas)*

**Cómo funciona:**
Cuando el usuario entra a la pantalla del proyecto (`page.tsx`), se inicializa el estado con el `project-store`. Si el proyecto está recién creado, su estado es `"welcome"`. El frontend realiza una llamada automática a la API de chat para solicitar el primer mensaje de bienvenida y comenzar la ronda de preguntas.

### 2. Conversación y Extracción de Datos en Lenguaje Natural (El Brief)
**Archivos consultados/utilizados:**
- `src/app/api/chat/route.ts` *(Endpoint Backend del Chat)*
- `src/services/conversation-manager.ts` *(Orquestador de estados del bot)*
- `src/services/field-extractor.ts` *(Servicio de Extracción por IA)*
- `src/lib/openai/client.ts` *(Instancia de conexión con OpenAI)*

**Cómo funciona:**
El corazón de la recopilación de datos no son formularios aburridos, sino una conversación. 
1. El usuario envía un mensaje respondiendo a una pregunta del bot.
2. El mensaje viaja a `/api/chat/route.ts`.
3. El archivo `conversation-manager.ts` sabe qué pregunta se le hizo recién al usuario, y envía el mensaje de respuesta hacia `field-extractor.ts`.
4. **Primera llamada a la IA (`gpt-4o-mini`)**: En `field-extractor.ts`, se le brinda a la IA la pregunta original y la respuesta en lenguaje natural del usuario. Se le instruye que actúe como "extractor de datos" y devuelva únicamente un objeto JSON con los valores crudos detectados (ejemplo: si el usuario dice *"Lo vendo a 50 dólares"*, la IA detecta `price: 50, currency: USD`). No inventa nada; si algo falta o es muy corto, levanta una bandera de `needs_clarification`.
5. Si faltan detalles, el bot hace preguntas de seguimiento. Una vez que obtiene los datos necesarios de toda la secuencia (`QUESTION_SEQUENCE`), avanza y le pide al usuario confirmar la información (*"dale"*).

### 3. Orquestador de Generación Base
**Archivos consultados/utilizados:**
- Función `generateLanding()` localizada en `src/app/api/chat/route.ts`
- `src/app/api/generate/route.ts` *(Endpoint de Polling para el frontend)*

**Cómo funciona:**
Al recibir la confirmación, se gatilla el proceso `generateLanding()` en segundo plano. Mientras esto ocurre, el frontend consulta a la ruta `/api/generate` para poder mostrar animaciones de progreso. 

Este orquestador principal encadena los siguientes **4 pasos de la magia de la IA y el ensamblaje:**

#### Paso 1: Clasificación del Arquetipo de Mercado
**Archivo consultado:** `src/services/archetype-classifier.ts`
- **Llamada a la IA (`gpt-4o-mini`)**: Se envía toda la información recolectada del producto y de la audiencia. Se le restringe a la IA a que catalogue el producto estrictamente dentro de 1 entre 6 arquetipos posibles de mercado predefinidos en nuestro sistema. Esto sirve para entender la "escala" o el entorno del producto.

#### Paso 2: Construcción de la Estrategia (Strategy Builder)
**Archivo consultado:** `src/services/strategy-builder.ts`
- **Llamada a la IA (`gpt-4o`)**: Este es el "Cerebro Persuasivo". Teniendo a mano toda la recolección de datos (Brief) sumado al Arquetipo recién descubierto, se instruye a la IA para que razone como un experto estratega de marketing.
- Piensa los deseos profundos del cliente, sus dolores objeciones y temáticas de Preguntas Frecuentes (FAQs).
- Devuelve la estrategia y el tipo de esqueleto/plantilla web (ej: `standard_infoproduct`) en formato JSON.

#### Paso 3: Redactor de Textos Estricto (Copy Generator V1.1)
**Archivos consultados:** `src/services/copy-generator.ts`, `src/types/landing.ts`
- **Llamada a la IA (`gpt-4o`)**: El paso literario. Ahora enviamos una petición a su personalidad "Copywriter de alto nivel". Como contexto, se le pasan el Brief y la Estrategia.
- **Novedad V1.1 (Contrato de Datos):** Para evitar que la IA alucine o invente campos inconsistentes, está atada a responder con una interfaz de Typescript unificada llamada `LandingCopy`. Todo el copy que se genere (títulos, beneficios, reviews, precios, FAQs y textos de oferta) devuelven una estructura JSON idéntica siempre.
- Se imponen reglas severas para que sea *mobile-first* y para gestionar objeciones sin mentiras irrazonables.

#### Paso 4: Motor de Renderizado Híbrido (HTML Renderer V1.1)
**Archivos consultados:** `src/services/html-renderer.ts`, `src/lib/html-renderer/constants.ts`, `src/lib/html-renderer/templates.ts`
- **Blindaje Estático (Ahorro y Seguridad):** El CSS (diseños, fuentes, colores) y el Javascript (carruseles de imágenes, barras de progreso, lógicas de acordeón FAQ y contadores de urgencia) fueron aislados manualmente del alcance de la IA en archivos constantes (`STATIC_HEAD`, `STATIC_SCRIPTS`). OpenAI *ya no pierde tokens ni toca* estos lenguajes.
- **Llamada a la IA (`gpt-4o`)**: El Motor llama a la IA pasándole ÚNICAMENTE el código base de la etiqueta del `<BODY>` (`BODY_SKELETON`) con placeholders (`{{variable}}`) y pasándole el JSON estricto proveniente de `LandingCopy`.
- La directiva de la IA se reduce exclusivamente a "Inyectar" o "Reemplazar" datos del JSON dentro del HTML del body, iterar sobre matrices (como beneficios o revisiones emitiendo `divs` pre-armados) y devolvernos de forma prístina la etiqueta `<body>` rellenada.
- **Ensamblaje Final y Validación:** El servidor de Next.js recolecta esta respuesta corta de OpenAI. Luego Next.js arma el "sánguche" definitivo incrustando `STATIC_HEAD` arriba, el código devuelto por OpenAI en el medio (Body), y `STATIC_SCRIPTS` abajo. Finalmente, interviene una sub-rutina de validación (`validateHtml`) para certificar que ningún `{{placeholder}}` quedó sin compilar, y que no existan tags de sintaxis basura como \`\`\`html.

### 4. Finalización y Mantenimiento de Estado (Edit Engine)
**Archivos consultados/utilizados:**
- `src/app/api/chat/route.ts` y `src/app/api/edit/route.ts` *(Endpoint Ediciones Rápida)*
- `src/services/edit-engine.ts`

**Cómo funciona:**
Una vez renderizado, el proyecto es marcado como `completed` y la IA descansa para que el usuario previsualice la web en `/project/[id]/results`. 
Si el usuario desea refinar algo (*"Hazlo más corto"*, *"Reescribe el título"*), esto impacta en el `edit-engine.ts`. Este motor lee el JSON actual `LandingCopy`, aplica transformaciones sutiles únicamente en los textos (gracias a sus reglas de conservación) y luego reinyecta este nuevo Output por nuestro ducto nativo de Ensamblaje Híbrido, regenerando una web perfecta en instantes, sin romper estéticas.

---
### Resumen Rápido (Arquitectura V1.1)
1. **Formulario Oculto en Chat:** `field-extractor.ts` usa GPT-4o-mini para obtener respuestas estructuradas conversando.
2. **Consultoría Virtual:** `strategy-builder.ts` piensa un abordaje psicológico en base al mercado usando GPT-4o.
3. **Escritura Controlada:** `copy-generator.ts` redacta textos magnéticos encerrándolos firmemente bajo la estructura de datos `LandingCopy`.
4. **Ensambladora Híbrida Inteligente:** Con un texto exquisito en mano, `html-renderer.ts` lo plancha e insiere inteligentemente dentro del esqueleto html, pero el servidor es quien ensambla después todo el CSS y el JS de manera estática y estricta, cuidando los tokens y el bolsillo. Las validaciones previenen errores garrafales.
5. **Cerrado y Listo para Ediciones Mágicas.**
