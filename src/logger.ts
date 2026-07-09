import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'suggest' });

export default logger;
