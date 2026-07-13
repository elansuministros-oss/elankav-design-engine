'use strict';

const { DesignEngineError } = require('../errors/DesignEngineError');

const PRICE_PATTERN =
  /(?:USD|NIO|C\$|U\$|\$)\s*\d+(?:[.,]\d+)?|\bprecio(?:s)?\b\s*[:=]?\s*\d+/i;

function stringifyValue(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? value.map((item) =>
        typeof item === 'object' ? JSON.stringify(item) : String(item)
      ).join('; ')
      : null;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

class PromptBuilderService {
  build({ request, plan = null } = {}) {
    if (!request) {
      throw new DesignEngineError(
        'PROMPT_INPUT_REQUIRED',
        'Prompt Builder requiere una solicitud validada.'
      );
    }

    const projectType =
      request.projectType || request.designType || request.type || null;
    const instructions = stringifyValue(request.instructions);
    const references = stringifyValue(request.references);
    const brandAssets = stringifyValue(
      request.brandAssets || request.assets || request.logoAssets
    );
    const materials = stringifyValue(request.materials);
    const lighting = stringifyValue(
      request.lighting || request.lightingType
    );
    const profile =
      plan?.profile?.id || request.profileId || 'DEFAULT';

    const hasUsefulDescription = Boolean(
      projectType || instructions || references || materials || lighting
    );

    if (!request.platform || !hasUsefulDescription) {
      return {
        type: 'NEEDS_INFORMATION',
        conversational: false,
        content: null,
        missing: [
          ...(!request.platform ? ['platform'] : []),
          ...(!hasUsefulDescription ? ['projectDescription'] : []),
        ],
        metadata: {
          requestId: request.requestId || null,
          platform: request.platform || null,
          profileId: profile,
        },
      };
    }

    const measurementStatus = request.measurementStatus || 'MISSING';
    const measurements = stringifyValue(request.measurements);

    if (measurementStatus === 'CONFIRMED' && !measurements) {
      return {
        type: 'NEEDS_INFORMATION',
        conversational: false,
        content: null,
        missing: ['confirmedMeasurements'],
        metadata: {
          requestId: request.requestId || null,
          platform: request.platform,
          profileId: profile,
        },
      };
    }

    const measurementRule = measurementStatus === 'CONFIRMED'
      ? `Conservar exactamente estas medidas confirmadas: ${measurements}. No reinterpretarlas ni sustituirlas.`
      : measurementStatus === 'ESTIMATED'
        ? `Las medidas son estimadas: ${measurements || 'sin valores declarados'}. Identificarlas visualmente como referencia, nunca como medida confirmada.`
        : 'No existen medidas confirmadas. No declarar, inferir ni mostrar dimensiones numéricas.';

    const content = [
      'Crear una única propuesta visual profesional y físicamente fabricable.',
      `Plataforma obligatoria: ${request.platform}. No mezclar marcas ni plataformas.`,
      projectType ? `Tipo de proyecto: ${projectType}.` : null,
      request.environment
        ? `Entorno: ${request.environment}.`
        : null,
      `Perfil técnico: ${profile}.`,
      measurementRule,
      instructions ? `Instrucciones: ${instructions}.` : null,
      materials ? `Materiales indicados: ${materials}.` : null,
      lighting ? `Iluminación indicada: ${lighting}.` : null,
      brandAssets
        ? `Usar únicamente estos assets de marca suministrados: ${brandAssets}. No inventar logotipos.`
        : 'No inventar logotipos ni marcas.',
      references ? `Referencias autorizadas: ${references}.` : null,
      'No introducir precios, promociones ni cifras comerciales.',
      'No cambiar la arquitectura real, proporciones confirmadas ni ubicación de montaje para mejorar el impacto visual.',
      'No agregar objetos, textos, estructuras o elementos que no fueron solicitados.',
      'No proponer materiales, uniones o iluminación imposibles de fabricar.',
      'La imagen es una propuesta visual; no conversar directamente con el cliente.',
    ].filter(Boolean).join('\n');

    if (PRICE_PATTERN.test(content)) {
      throw new DesignEngineError(
        'PRICE_IN_PROMPT_FORBIDDEN',
        'Los precios no pueden incluirse dentro del prompt.'
      );
    }

    return {
      type: 'DESIGN_PROMPT',
      conversational: false,
      content,
      metadata: {
        requestId: request.requestId || null,
        platform: request.platform,
        profileId: profile,
        measurementStatus,
        confirmedMeasurements:
          measurementStatus === 'CONFIRMED'
            ? request.measurements
            : [],
      },
    };
  }
}

module.exports = {
  PromptBuilderService,
  PRICE_PATTERN,
};
