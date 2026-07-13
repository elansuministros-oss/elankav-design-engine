'use strict';

const { DesignEngineError } = require('../errors/DesignEngineError');

const MEASUREMENT_STATES = new Set([
  'CONFIRMED',
  'ESTIMATED',
  'MISSING',
]);

class DesignRequestService {
  validate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new DesignEngineError(
        'INVALID_DESIGN_REQUEST',
        'La solicitud debe ser un objeto estructurado.'
      );
    }

    if (input.actor?.source !== 'ELAN_IA') {
      throw new DesignEngineError(
        'INVALID_ENTRY_SOURCE',
        'ELAN IA es la única entrada autorizada.'
      );
    }

    if (!input.platform || typeof input.platform !== 'string') {
      throw new DesignEngineError(
        'PLATFORM_REQUIRED',
        'La plataforma es obligatoria.'
      );
    }

    if (input.directClientConversation === true) {
      throw new DesignEngineError(
        'DIRECT_CLIENT_CONVERSATION_FORBIDDEN',
        'El Design Engine no conversa directamente con clientes.'
      );
    }

    if (!MEASUREMENT_STATES.has(input.measurementStatus)) {
      throw new DesignEngineError(
        'INVALID_MEASUREMENT_STATUS',
        'El estado de medidas no es válido.'
      );
    }

    if (
      input.measurementStatus === 'CONFIRMED' &&
      (!Array.isArray(input.measurements) || input.measurements.length === 0)
    ) {
      throw new DesignEngineError(
        'CONFIRMED_MEASUREMENTS_REQUIRED',
        'Las medidas confirmadas deben incluir valores.'
      );
    }

    return Object.freeze({
      ...input,
      measurements: Array.isArray(input.measurements)
        ? input.measurements.map((item) => Object.freeze({ ...item }))
        : [],
    });
  }
}

module.exports = {
  DesignRequestService,
};
