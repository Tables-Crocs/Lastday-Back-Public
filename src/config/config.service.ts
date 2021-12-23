import { parse } from 'dotenv';
import * as fs from 'fs';
// import * as joi from '@hapi/joi';
import * as joi from 'joi';

/**
 * Key-value mapping
 */
export interface EnvConfig {
  [key: string]: string;
}

/**
 * Config Service
 */
export class ConfigService {
  /**
   * Object that will contain the injected environment variables
   */
  private readonly envConfig: EnvConfig;

  /**
   * Constructor
   * @param {string} filePath
   */
  constructor(filePath: string) {
    const config = parse(fs.readFileSync(filePath));
    this.envConfig = ConfigService.validateInput(config);
    this.envConfig['DB'] = `mongodb+srv://${this.envConfig['DB_USERNAME']}\
:${this.envConfig['DB_PASSWORD']}\
@${this.envConfig['DB_CLUSTER']}\
.mongodb.net/${this.envConfig['DB_NAME']}\
?retryWrites=true&w=majority`;
    console.log(`The DB is here ${this.envConfig['DB']}`);
  }

  /**
   * Ensures all needed variables are set, and returns the validated JavaScript object
   * including the applied default values.
   * @param {EnvConfig} envConfig the configuration object with variables from the configuration file
   * @returns {EnvConfig} a validated environment configuration object
   */
  private static validateInput(envConfig: EnvConfig): EnvConfig {
    /**
     * A schema to validate envConfig against
     */
    const envVarsSchema: joi.ObjectSchema = joi.object({
      APP_ENV: joi.string().valid('dev', 'prod').default('dev'),
      APP_URL: joi.string().uri({
        scheme: [/https?/],
      }),
      WEBTOKEN_SECRET_KEY: joi.string().required(),
      WEBTOKEN_EXPIRATION_TIME: joi.number().default(1800),
      DB_NAME: joi.string().required(),
      DB_CLUSTER: joi.string().required(),
      DB_USERNAME: joi.string().required(),
      DB_PASSWORD: joi.string().required(),
      MODEL_IP: joi.string().required(),
      MODEL_IP_PORT: joi.string().required(),
      KAKAOAPI_ENDPOINT: joi.string().required(),
      KAKAOAPI_KEY: joi.string().required(),
      TOURAPI_ENDPOINT: joi.string().required(),
      TOURAPI_DECODED_KEY: joi.string().required(),
      SG_API_KEY: joi.string().required(),
      SG_EMAIL: joi.string().required(),
    });

    /**
     * Represents the status of validation check on the configuration file
     */
    const { error, value: validatedEnvConfig } =
      envVarsSchema.validate(envConfig);
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    return validatedEnvConfig;
  }

  /**
   * Fetches the key from the configuration file
   * @param {string} key
   * @returns {string} the associated value for a given key
   */
  get(key: string): string {
    return this.envConfig[key];
  }

  /**
   * Checks whether the application environment set in the configuration file matches the environment parameter
   * @param {string} env
   * @returns {boolean} Whether or not the environment variable matches the application environment
   */
  isEnv(env: string): boolean {
    return this.envConfig.APP_ENV === env;
  }

}
