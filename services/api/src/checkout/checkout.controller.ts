import { BadRequestException, Body, Controller, Get, Param, Post, Redirect, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { ZodPipe } from '../common/zod.pipe';
import { Public, CurrentUser } from '../common/decorators';
import type { AuthUser, AuthedRequest } from '../common/request';
import { clientIp } from '../common/request';
import { CheckoutService } from './checkout.service';
import { env } from '../common/env';

const initSchema = z.object({
  planId: z.string().min(1),
  ackAccepted: z.literal(true, { error: 'Mesafeli Satış Sözleşmesi\'ni kabul etmelisiniz.' }),
});

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly service: CheckoutService) {}

  /** Abonelik ödeme formu başlat — üye kimlik doğrulaması gerekli */
  @Post('subscription')
  async initSubscription(
    @CurrentUser() me: AuthUser,
    @Body(new ZodPipe(initSchema)) body: z.infer<typeof initSchema>,
    @Req() req: AuthedRequest,
  ) {
    return this.service.initSubscription(me.id, body.planId, clientIp(req) ?? '127.0.0.1');
  }

  /**
   * iyzico ödeme geri bildirimi — PUBLIC.
   * Browser taraflı POST yönlendirmesiyle gelir; JSON değil form verisi.
   */
  @Public()
  @Post('callback')
  async callback(@Body() body: Record<string, string>, @Res() res: Response) {
    const token = body['token'];
    const conversationId = body['conversationId'];
    if (!token || !conversationId) {
      return res.redirect(`${env.APP_URL}/checkout/failed?reason=missing_params`);
    }
    const result = await this.service.processCallback(token, conversationId);
    if (result.ok) {
      return res.redirect(`${env.APP_URL}/checkout/success?ref=${result.subscriptionId}`);
    }
    return res.redirect(`${env.APP_URL}/checkout/failed?reason=payment_failed`);
  }

  /** Ödeme durumu sorgula (frontend polling için) */
  @Get('status/:paymentId')
  getStatus(@Param('paymentId') paymentId: string, @CurrentUser() me: AuthUser) {
    return this.service.getPaymentStatus(paymentId, me.id);
  }
}
