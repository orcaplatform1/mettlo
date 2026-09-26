import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AccountController } from './account/account.controller';
import { AdminExtraController, ReportsController } from './admin/admin-extra.controller';
import { MaintenanceService } from './maintenance/maintenance.service';
import { MeController } from './me/me.controller';
import { AdminFormsController, PublicFormsController } from './forms/forms.controller';
import { AdminSubCategoriesController } from './admin/sub-categories.controller';
import { RunningService } from './sports/running.service';
import { SportsCoachController } from './sports/sports-coach.controller';
import { SportsMemberController } from './sports/sports.controller';
import { PresenceController } from './presence/presence.controller';
import { PresenceService } from './presence/presence.service';
import { MemberController } from './member/member.controller';
import { CreatorContentController } from './tools/content.controller';
import { CreatorToolsController, InvitesController } from './tools/creator-tools.controller';
import { AdminController } from './admin/admin.controller';
import { AuthModule } from './auth/auth.module';
import { CoachingController } from './coaching/coaching.controller';
import { AuthorizationGuard, JwtAuthGuard } from './common/guards';
import { CommonModule } from './common/common.module';
import { CreatorsController } from './creators/creators.controller';
import { HealthController } from './health.controller';
import { MessagingController } from './messaging/messaging.controller';
import { PublicController } from './public/public.controller';
import { ReviewsController } from './reviews/reviews.controller';
import { AdminTicketsController, SupportController } from './support/support.controller';
import { SupportService } from './support/support.service';
import { BlocksController } from './blocks/blocks.controller';
import { CheckoutController } from './checkout/checkout.controller';
import { LiveController } from './live/live.controller';
import { CheckoutService } from './checkout/checkout.service';
import { IyzicoService } from './checkout/iyzico.service';
import { LocationController } from './location/location.controller';
import { BusinessController } from './business/business.controller';
import { AdminBusinessController } from './business/admin-business.controller';
import { CoachWorkplaceController } from './business/coach-workplace.controller';
import { AdvertisingController } from './advertising/advertising.controller';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    // Genel hız sınırı: IP başına dakikada 120 istek; auth uçlarında daha sıkı (bkz. @Throttle)
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
      // Yalnızca test örneğinde (METTLO_TEST_BYPASS tanımlıysa) ve doğru başlıkla atlanır; üretimde değişken yoktur.
      skipIf: (ctx) => {
        const req = ctx.switchToHttp().getRequest();
        const bypass = process.env.METTLO_TEST_BYPASS;
        if (bypass && req.headers['x-test-bypass'] === bypass) return true;
        // Next.js sunucusunun iç GET okumaları (herkese açık sayfalar) tek IP'den gelir; kullanıcı başına sınırlanmamalı.
        const key = process.env.INTERNAL_API_KEY;
        return !!key && req.method === 'GET' && req.headers['x-internal-key'] === key;
      },
    }),
  ],
  controllers: [PublicController, CreatorsController, AdminController, CoachingController, MessagingController, AccountController, ReviewsController, SupportController, AdminTicketsController, MeController, CreatorToolsController, InvitesController, AdminExtraController, ReportsController, CreatorContentController, MemberController, PublicFormsController, AdminFormsController, AdminSubCategoriesController, SportsMemberController, SportsCoachController, PresenceController, HealthController, CheckoutController, BlocksController, LiveController, LocationController, BusinessController, AdminBusinessController, CoachWorkplaceController, AdvertisingController],
  providers: [
    SupportService,
    PresenceService,
    RunningService,
    MaintenanceService,
    CheckoutService,
    IyzicoService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: AuthorizationGuard },
  ],
})
export class AppModule {}
