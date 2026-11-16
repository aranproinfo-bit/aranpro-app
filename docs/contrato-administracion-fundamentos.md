# Contrato de administración: fundamento y alcance

Revisión: 16 de noviembre de 2026. Redacción propia para ARANPRO. No constituye un modelo avalado por un gremio ni un dictamen jurídico. Antes de la firma, revisar con abogado chileno la modalidad real de prestación, personería, poderes, inscripción y acuerdos comerciales específicos.

## Fuentes verificadas

- Ley 21.442, especialmente artículos 18-22, 36, 43, 84 y 87 y siguientes: https://www.bcn.cl/leychile/navegar?idNorma=1174663
- Reglamento de la Ley 21.442, DS 7 MINVU **de 2023**, publicado el 9 de enero de 2025, especialmente artículos 26-29: https://www.bcn.cl/leychile/navegar?idNorma=1210089
- Código Civil, mandato (Libro IV, Título XXIX), diligencia, alcance, rendición y término, especialmente 2129, 2131-2135, 2155 y 2163 y siguientes: https://www.bcn.cl/leychile/navegar?i=172986
- Dirección del Trabajo, Ordinario 513 de 11-04-2023, administración civil y examen de subordinación: https://www.dt.gob.cl/legislacion/1624/w3-article-124032.html
- Dirección del Trabajo, naturaleza de la relación según hechos, no solo el nombre del instrumento: https://dt.gob.cl/laborito/1614/w3-article-60768.html
- Código del Trabajo, artículos 7, 8, 183-A y siguientes, 184 y 184 bis: https://www.bcn.cl/leychile/navegar?idNorma=207436
- DT, protección de trabajadores y DS 44: https://www.dt.gob.cl/portal/1628/w3-article-127516.html
- DT, información y retención en subcontratación: https://www.dt.gob.cl/portal/1628/w3-article-94241.html
- Ley 21.643 (Ley Karin): https://www.bcn.cl/leychile/navegar?idNorma=1200096
- Ley 19.628 y reforma 21.719 según vigencia. No se presenta la reforma como ya vigente ni se codifica una fecha futura que pueda cambiar: https://www.bcn.cl/leychile/navegar?idNorma=1209272

## Búsqueda de modelos gremiales

- CGAI anuncia documentos descargables como beneficio de socios; no se obtuvo un contrato público completo: https://www.cgai.cl/home/asociese/
- AGACECH condiciona las descargas de su repositorio a asociarse: https://agacech.com/repositorio-de-documentos/
- ComunidadFeliz anuncia un modelo de contrato para administrador, pero requiere formulario para recibirlo; no se envió información del usuario ni se afirma haber revisado su texto completo: https://www.comunidadfeliz.cl/material/contrato-de-prestacion-de-servicios-de-un-administrador
- La publicación de AGACECH sobre protección del administrador describe **propuestas**. No se incorporaron como si fueran leyes vigentes: https://agacech.com/proteccion-a-los-administradores-de-condominios/

## Decisiones contractuales

- Modelo de mandato/servicios independientes. No reemplaza un contrato laboral si los hechos configuran subordinación y dependencia. No contiene renuncia a derechos laborales.
- No se infiere personalidad jurídica del nombre comercial ARANPRO. Se exige identificar al prestador legal y su representación en el anexo.
- No se certifica vigencia RNAC por mostrar un número o sello.
- Se preservan remoción por asamblea, formalidades del nombramiento y competencias del comité. El aviso comercial no vuelve irrevocable el cargo.
- Rendición mensual, ante asamblea ordinaria y al cese; documentación con 24 horas de anticipación. Programa de mantención de doce meses según reglamento.
- Se separan representación del empleador, deberes del personal del condominio y posible relación laboral del propio administrador.
- No hay exoneración general por negligencia, límite artificial a la indemnización ni garantía de resultado absoluto. La responsabilidad se asigna según conducta, causalidad y norma aplicable.
- **Los diez días hábiles de entrega final son una condición contractual propuesta**, no un plazo legal general. Se expresa así en el documento y no posterga entregas urgentes.
- No se impone arbitraje ni se condicionan denuncias o acciones a una mediación previa.
- Los campos vacíos no se sustituyen por hechos inventados. Las condiciones de la comunidad se leen mediante `activeProposalConditions`; nunca se recuperan de otra oportunidad.
- Un cambio en el panel configura el siguiente borrador; no modifica un instrumento ya suscrito.

## Implementación

Texto central en `src/data/managementContract.js`. Un único componente `ManagementContract.jsx` sirve a vista previa, impresión de Paso 5 y Bandeja de Documentos. Estilos circunscritos al contrato: no alteran la carta sin logo ni otros documentos. Firma desde la configuración de empresa, conservando escala. Anexo repartido según extensión, sin recortar los valores.
