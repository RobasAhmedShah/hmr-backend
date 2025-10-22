import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AuditListener {
  private readonly logger = new Logger(AuditListener.name);

  /**
   * Listen to all events for audit trail
   */
  @OnEvent('**', { async: true })
  async logEvent(event: any) {
    try {
      const timestamp = new Date().toISOString();
      const eventType = event.constructor?.name || 'UnknownEvent';
      const eventId = event.eventId || 'unknown';
      
      this.logger.log(`[${timestamp}] ${eventType} (${eventId}): ${JSON.stringify(event, null, 2)}`);
    } catch (error) {
      this.logger.error('Failed to log event:', error);
      // Don't throw - let the main operation continue
    }
  }
}
