'use strict';

class ArchitectureAnalysisService {
  analyze(request = {}) {
    const measurementStatus =
      request.measurementStatus || 'MISSING';

    return {
      requestId: request.requestId || null,
      environment: request.environment || null,
      measurementStatus,
      fabricationMeasurementsConfirmed:
        measurementStatus === 'CONFIRMED',
      photoMeasurementsAllowed: false,
      warnings:
        measurementStatus === 'ESTIMATED'
          ? [
              'Las medidas estimadas no pueden utilizarse como medidas de fabricación.',
            ]
          : [],
    };
  }
}

module.exports = {
  ArchitectureAnalysisService,
};
