import { pathsToModuleNameMapper } from 'ts-jest';
import type { Config } from 'jest';
import { readFileSync } from 'fs';

const { compilerOptions } = JSON.parse(readFileSync('./tsconfig.json', 'utf8'));

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/../',
  }),
};

export default config;
