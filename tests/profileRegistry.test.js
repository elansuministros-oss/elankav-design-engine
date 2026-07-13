'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ProfileRegistry,
} = require('../profiles/profileRegistry');

function createProfile(overrides = {}) {
  return {
    id: 'SIGNAGE-BASE',
    version: '1.0.0',
    category: 'signage',
    supportedProjectTypes: ['SIGNAGE_REQUEST'],
    materials: [],
    fixings: [],
    lighting: [],
    environments: ['INTERIOR', 'EXTERIOR'],
    compositionRules: [],
    restrictions: [],
    allowedOutputs: ['PLAN'],
    qaRules: [],
    ...overrides,
  };
}

test('registra y recupera un perfil versionado', () => {
  const registry = new ProfileRegistry();

  registry.register(createProfile());

  const profile = registry.get('SIGNAGE-BASE', '1.0.0');

  assert.equal(profile.id, 'SIGNAGE-BASE');
  assert.equal(profile.version, '1.0.0');
  assert.equal(profile.category, 'signage');
});

test('rechaza un perfil inexistente', () => {
  const registry = new ProfileRegistry();

  assert.throws(
    () => registry.get('DOES-NOT-EXIST', '1.0.0'),
    (error) => error.code === 'PROFILE_NOT_FOUND'
  );
});

test('rechaza perfiles duplicados con la misma versión', () => {
  const registry = new ProfileRegistry();

  registry.register(createProfile());

  assert.throws(
    () => registry.register(createProfile()),
    (error) => error.code === 'DUPLICATE_PROFILE'
  );
});

test('mantiene separadas las versiones del mismo perfil', () => {
  const registry = new ProfileRegistry();

  registry.register(createProfile({ version: '1.0.0' }));
  registry.register(createProfile({ version: '2.0.0' }));

  assert.equal(registry.list().length, 2);
  assert.equal(
    registry.get('SIGNAGE-BASE', '2.0.0').version,
    '2.0.0'
  );
});
