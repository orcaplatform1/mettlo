import { BadRequestException, Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { CurrentUser } from '../common/decorators';
import type { AuthUser } from '../common/request';
import { PrismaService } from '../common/prisma.service';
import { env } from '../common/env';

@Controller('ai/matching')
export class AiMatchingController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('coach')
  async matchCoach(
    @CurrentUser() u: AuthUser,
    @Body() dto: {
      goals: string[];
      fitnessLevel?: string;
      branchPreferences?: string[];
      budgetRange?: string;
      preferredWorkMode?: string;
      location?: string;
      additionalContext?: string;
    },
  ) {
    // Özellik bayrağı kontrolü
    const featureFlag = await this.prisma.platformConfig.findUnique({ where: { key: 'ENABLE_AI_MATCHING' } });
    if (featureFlag?.value !== 'true') throw new ForbiddenException('AI eşleştirme henüz aktif değil.');

    if (!env.ANTHROPIC_API_KEY) throw new ForbiddenException('AI servisi yapılandırılmamış.');
    if (!dto.goals?.length) throw new BadRequestException('Hedefler gerekli.');

    const startAt = Date.now();
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const prompt = `Sen Mettlo'nun AI fitness koç eşleştirme sisteminin asistanısın. Kullanıcı verilerine göre ideal koç profilini belirle.

Kullanıcı Bilgileri:
- Hedefler: ${dto.goals.join(', ')}
- Fitness Seviyesi: ${dto.fitnessLevel ?? 'belirtilmedi'}
- Branş Tercihleri: ${dto.branchPreferences?.join(', ') ?? 'belirtilmedi'}
- Bütçe: ${dto.budgetRange ?? 'belirtilmedi'}
- Çalışma Şekli: ${dto.preferredWorkMode ?? 'belirtilmedi'}
- Konum: ${dto.location ?? 'belirtilmedi'}
${dto.additionalContext ? `- Ek Bilgi: ${dto.additionalContext}` : ''}

JSON formatında yanıt ver (başka metin ekleme):
{
  "idealCoachProfile": {
    "specializations": ["string"],
    "experienceLevel": "beginner|intermediate|advanced",
    "recommendedBranches": ["string"],
    "coachingStyle": "string",
    "keyQualities": ["string"]
  },
  "searchKeywords": ["string"],
  "priorityFactors": ["string"],
  "reasoning": "string"
}`;

    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });
    } catch (err) {
      throw new BadRequestException('AI servisi şu an yanıt vermiyor.');
    }

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';
    let parsed: unknown;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { reasoning: text };
    } catch {
      parsed = { reasoning: text };
    }

    await this.prisma.aiMatchingLog.create({
      data: {
        userId: u.id,
        queryJson: dto,
        responseJson: parsed as any,
        modelUsed: 'claude-haiku-4-5-20251001',
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        durationMs: Date.now() - startAt,
      },
    });

    return { result: parsed, modelUsed: 'claude-haiku-4-5-20251001' };
  }
}
