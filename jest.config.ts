/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const makeConfig = async () => {
  const config = await createJestConfig({
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/_test/setup-tests.ts'],
  })()

  return {
    ...config,
    transformIgnorePatterns: ['^.+\\.module\\.(css|sass|scss)$', 'node_modules/(?!(nanoid)/)'],
  }
}

export default makeConfig
