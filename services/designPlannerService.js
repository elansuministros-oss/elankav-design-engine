'use strict';

const { DesignEngineError } = require('../errors/DesignEngineError');

class DesignPlannerService {
  constructor({
    profileRegistry,
    platformBrandingService,
    proposalLimitService,
    brandAuditService = null,
    architectureAnalysisService = null,
  } = {}) {
    this.profileRegistry = profileRegistry;
    this.platformBrandingService = platformBrandingService;
    this.proposalLimitService = proposalLimitService;
    this.brandAuditService = brandAuditService;
    this.architectureAnalysisService =
      architectureAnalysisService;
  }

  plan(request) {
    if (!request?.profileId || !request?.profileVersion) {
      throw new DesignEngineError(
        'PROFILE_REQUIRED',
        'La solicitud debe indicar profileId y profileVersion.'
      );
    }

    if (
      !this.profileRegistry ||
      !this.platformBrandingService ||
      !this.proposalLimitService
    ) {
      throw new DesignEngineError(
        'PLANNER_DEPENDENCY_NOT_CONFIGURED',
        'El planificador requiere perfiles, branding y límites.'
      );
    }

    const proposal = this.proposalLimitService.evaluate({
      proposalConsumed: request.proposalConsumed,
      authorization:
        request.proposalAuthorization || null,
    });

    const profile = this.profileRegistry.get(
      request.profileId,
      request.profileVersion
    );

    const branding =
      this.platformBrandingService.resolve(
        request.platform
      );

    const brandAudit = this.brandAuditService
      ? this.brandAuditService.audit(request)
      : null;

    const architecture =
      this.architectureAnalysisService
        ? this.architectureAnalysisService.analyze(request)
        : null;

    return {
      requestId: request.requestId,
      platform: request.platform,
      profile,
      branding,
      proposal,
      brandAudit,
      architecture,
      conversational: false,
    };
  }
}

module.exports = {
  DesignPlannerService,
};
