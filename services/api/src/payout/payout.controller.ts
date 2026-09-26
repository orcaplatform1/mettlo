import {
  Body, Controller, Delete, Get, Param, Post, Query,
} from '@nestjs/common';
import { CurrentUser, Public, RequirePermission } from '../common/decorators';
import type { AuthUser } from '../common/request';
import { PayoutService } from './payout.service';

@Controller('earnings')
export class EarningsController {
  constructor(private readonly svc: PayoutService) {}

  /** GET /earnings — bakiye özeti */
  @Get()
  getBalance(@CurrentUser() u: AuthUser) {
    return this.svc.getBalance(u.id);
  }

  /** GET /earnings/history — kazanç geçmişi */
  @Get('history')
  getHistory(@CurrentUser() u: AuthUser, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.svc.getEarningsSummary(u.id, Number(page ?? 1), Number(limit ?? 20));
  }
}

@Controller('payout-accounts')
export class PayoutAccountController {
  constructor(private readonly svc: PayoutService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.svc.getPayoutAccounts(u.id);
  }

  @Post()
  add(
    @CurrentUser() u: AuthUser,
    @Body() dto: { iban: string; accountHolderName: string; bankName?: string },
  ) {
    return this.svc.addPayoutAccount(u.id, dto);
  }
}

@Controller('payouts')
export class PayoutController {
  constructor(private readonly svc: PayoutService) {}

  @Get()
  list(@CurrentUser() u: AuthUser, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.svc.getPayouts(u.id, Number(page ?? 1), Number(limit ?? 20));
  }

  @Post()
  request(@CurrentUser() u: AuthUser, @Body() dto: { amountKurus: number; payoutAccountId: string }) {
    return this.svc.requestPayout(u.id, dto);
  }

  @Delete(':id')
  cancel(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.cancelPayout(u.id, id);
  }
}

@Controller('admin/payouts')
export class AdminPayoutController {
  constructor(private readonly svc: PayoutService) {}

  @Get()
  @RequirePermission('finance:refund_approve')
  list(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.adminListPayouts({ status, page: Number(page ?? 1), limit: Number(limit ?? 30) });
  }

  @Post(':id/approve')
  @RequirePermission('finance:refund_approve')
  approve(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.adminApprovePayout(u.id, id);
  }

  @Post(':id/cancel')
  @RequirePermission('finance:refund_approve')
  cancel(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: { reason: string }) {
    return this.svc.adminCancelPayout(u.id, id, dto.reason);
  }
}

@Controller('payout-webhook')
export class PayoutWebhookController {
  constructor(private readonly svc: PayoutService) {}

  @Public()
  @Post()
  handle(@Body() body: { eventId: string; eventType: string; provider: string; payoutId?: string; payload?: unknown }) {
    return this.svc.handleWebhook(body.eventId, body.eventType, body.provider, body.payload ?? body, body.payoutId);
  }
}
