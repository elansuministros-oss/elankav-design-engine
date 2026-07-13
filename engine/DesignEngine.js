'use strict';

const { DesignEngineError } = require('../errors/DesignEngineError');

class DesignEngine {
  constructor({
    designRequestService,
    designPlannerService,
    renderService,
    visualQaService,
  } = {}) {
    this.designRequestService = designRequestService;
    this.designPlannerService = designPlannerService;
    this.renderService = renderService;
    this.visualQaService = visualQaService;
  }

  async execute(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new DesignEngineError(
        'INVALID_DESIGN_REQUEST',
        'La solicitud de diseño debe ser un objeto estructurado.'
      );
    }

    if (input.directClientConversation === true) {
      throw new DesignEngineError(
        'DIRECT_CLIENT_CONVERSATION_FORBIDDEN',
        'El Design Engine no puede conversar directamente con clientes.'
      );
    }

    if (input.actor?.source !== 'ELAN_IA') {
      throw new DesignEngineError(
        'INVALID_ENTRY_SOURCE',
        'ELAN IA es la única entrada autorizada para solicitudes de diseño.'
      );
    }

    if (!this.designRequestService) {
      throw new DesignEngineError(
        'SERVICE_NOT_CONFIGURED',
        'designRequestService no está configurado.'
      );
    }

    const request = await this.designRequestService.validate(input);

    const plan = this.designPlannerService
      ? await this.designPlannerService.plan(request)
      : null;

    const render = this.renderService
      ? await this.renderService.execute({ request, plan })
      : null;

    const qa = this.visualQaService
      ? await this.visualQaService.evaluate({ request, plan, render })
      : null;

    return {
      designId: null,
      status: render ? 'PROCESSED' : 'PLANNED',
      profile: plan?.profile || null,
      version: 1,
      assets: render?.assets || [],
      qa,
      cost: {
        authorized: request.costAuthorization?.authorized === true,
        amount: null,
        currency: null
      },
      warnings: [],
      platform: request.platform,
      branding: plan?.branding || null,
      elanIaResult: {
        type: 'DESIGN_RESULT',
        conversational: false,
        clientReady: qa?.approved === true
      }
    };
  }
}

module.exports = {
  DesignEngine,
};
