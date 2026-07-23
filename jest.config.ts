import { pathsToModuleNameMapper } from 'ts-jest';
import type { Config } from 'jest';
import { readFileSync } from 'fs';

const { compilerOptions } = JSON.parse(readFileSync('./tsconfig.json', 'utf8'));

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/../',
  }),
};

export default config;
