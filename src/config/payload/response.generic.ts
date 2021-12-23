/**
 * Models a typical response for a crud operation
 */
export interface IGenericMsgBody {
  /**
   * Status message to return
   */
  statusCode: number;
  // success: boolean;
  message: string;
  data?: unknown;
}
