import { Injectable } from '@nestjs/common';
import { runZones, weekStartOf, zoneOfRun } from '@mettlo/health';
import { PrismaService } from '../common/prisma.service';
import { iso, num } from './sports.shared';

@Injectable()
export class RunningService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ayakkabı toplam km = başlangıç km + bağlı koşuların toplamı */
  async recountShoes(memberId: string) {
    const shoes = await this.prisma.runningShoe.findMany({ where: { memberId }, select: { id: true, initialKm: true } });
    if (!shoes.length) return;
    const sums = await this.prisma.runningLog.groupBy({ by: ['shoeId'], where: { memberId, shoeId: { in: shoes.map((s) => s.id) } }, _sum: { distanceKm: true } });
    const by = new Map(sums.map((s) => [s.shoeId, Number(s._sum.distanceKm ?? 0)]));
    for (const s of shoes) await this.prisma.runningShoe.update({ where: { id: s.id }, data: { totalKm: Number(s.initialKm) + (by.get(s.id) ?? 0) } });
  }

  /** Üye + (isteğe bağlı) koç görünümü için özet. `includeHealth=false` ise nabız/yaralanma dönmez. */
  async overview(memberId: string, opts: { includeHealth: boolean; coachId?: string; weeks?: number }) {
    const weeks = opts.weeks ?? 8;
    const now = new Date();
    const thisWeek = weekStartOf(now);
    const from = new Date(thisWeek.getTime() - (weeks - 1) * 7 * 864e5);
    const [profile, logs, plans, goals, shoes, injuries] = await Promise.all([
      this.prisma.runningProfile.findUnique({ where: { memberId } }),
      this.prisma.runningLog.findMany({ where: { memberId, date: { gte: from } }, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], take: 200 }),
      this.prisma.coachRunningPlan.findMany({ where: { memberId, ...(opts.coachId ? { coachId: opts.coachId } : {}), weekStart: { gte: from } }, orderBy: [{ weekStart: 'asc' }, { dayOfWeek: 'asc' }] }),
      this.prisma.memberRaceGoal.findMany({ where: { memberId, ...(opts.coachId ? { OR: [{ coachId: opts.coachId }, { coachId: null }] } : {}) }, orderBy: { raceDate: 'asc' }, take: 20 }),
      opts.coachId ? [] : this.prisma.runningShoe.findMany({ where: { memberId }, orderBy: { createdAt: 'desc' } }),
      opts.includeHealth ? this.prisma.runningInjuryLog.findMany({ where: { memberId }, orderBy: { startedOn: 'desc' }, take: 20 }) : [],
    ]);
    const zin = { maxHeartRate: profile?.maxHeartRate, fiveKPaceSec: profile?.fiveKPaceSec };
    const weekly: Array<{ weekStart: string; actualKm: number; plannedKm: number; phase: string | null }> = [];
    for (let i = 0; i < weeks; i++) {
      const ws = new Date(from.getTime() + i * 7 * 864e5), we = new Date(ws.getTime() + 7 * 864e5);
      const actual = logs.filter((l) => l.date >= ws && l.date < we).reduce((n, l) => n + Number(l.distanceKm), 0);
      const pl = plans.filter((p) => p.weekStart.getTime() === ws.getTime());
      weekly.push({ weekStart: iso(ws), actualKm: Math.round(actual * 10) / 10, plannedKm: Math.round(pl.reduce((n, p) => n + Number(p.targetDistanceKm ?? 0), 0) * 10) / 10, phase: pl[0]?.phase ?? null });
    }
    // Bu haftanın zone dağılımı (km bazlı)
    const dist: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, none: 0 };
    for (const l of logs.filter((x) => x.date >= thisWeek)) {
      const z = zoneOfRun({ avgHeartRate: opts.includeHealth ? l.avgHeartRate : null, avgPaceSecPerKm: l.avgPaceSecPerKm }, opts.includeHealth ? zin : { fiveKPaceSec: zin.fiveKPaceSec });
      dist[z ? String(z) : 'none'] += Number(l.distanceKm);
    }
    for (const k of Object.keys(dist)) dist[k] = Math.round(dist[k]! * 10) / 10;
    const activeGoal = goals.find((g) => g.status === 'ACTIVE' && g.raceDate >= new Date(now.toISOString().slice(0, 10)));
    return {
      profile: profile ? { maxHeartRate: opts.includeHealth ? profile.maxHeartRate : null, fiveKPaceSec: profile.fiveKPaceSec } : null,
      zones: runZones(opts.includeHealth ? zin : { fiveKPaceSec: zin.fiveKPaceSec }),
      weekly, zoneDistribution: dist,
      logs: logs.slice(0, 40).map((l) => ({ id: l.id, date: iso(l.date), distanceKm: Number(l.distanceKm), durationSec: l.durationSec, avgPaceSecPerKm: l.avgPaceSecPerKm, avgHeartRate: opts.includeHealth ? l.avgHeartRate : null, runType: l.runType, shoeId: l.shoeId, notes: l.notes, source: l.source })),
      plan: plans.filter((p) => p.weekStart >= thisWeek).map((p) => ({ id: p.id, coachId: p.coachId, weekNumber: p.weekNumber, weekStart: iso(p.weekStart), phase: p.phase, dayOfWeek: p.dayOfWeek, runType: p.runType, targetDistanceKm: num(p.targetDistanceKm), targetPaceZone: p.targetPaceZone, notes: p.notes })),
      phases: [...new Map(plans.map((p) => [iso(p.weekStart), p.phase])).entries()].map(([weekStart, phase]) => ({ weekStart, phase })),
      goals: goals.map((g) => ({ id: g.id, name: g.name, distance: g.distance, raceDate: iso(g.raceDate), targetTimeSec: g.targetTimeSec, status: g.status, byCoach: !!g.coachId })),
      countdown: activeGoal ? { goalId: activeGoal.id, name: activeGoal.name, days: Math.round((activeGoal.raceDate.getTime() - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) / 864e5) } : null,
      shoes: shoes.map((s) => ({ id: s.id, brand: s.brand, model: s.model, purchasedAt: s.purchasedAt ? iso(s.purchasedAt) : null, initialKm: Number(s.initialKm), totalKm: Number(s.totalKm), retired: s.retired })),
      injuries: injuries.map((i) => ({ id: i.id, startedOn: iso(i.startedOn), endedOn: i.endedOn ? iso(i.endedOn) : null, area: i.area, severity: i.severity, pauseTraining: i.pauseTraining, notes: i.notes })),
    };
  }
}
