import { defineMessage } from '@lingui/macro';
import { formatNumber, formatPercentage } from 'common/format';
import SPELLS from 'common/SPELLS';
import { TALENTS_MONK } from 'common/TALENTS';
import RESOURCE_TYPES from 'game/RESOURCE_TYPES';
import { SpellLink, TooltipElement } from 'interface';
import CooldownExpandable, {
  CooldownExpandableItem,
} from 'interface/guide/components/CooldownExpandable';
import Analyzer, { Options, SELECTED_PLAYER } from 'parser/core/Analyzer';
import Events, {
  ApplyBuffEvent,
  CastEvent,
  HealEvent,
  ResourceChangeEvent,
} from 'parser/core/Events';
import { ThresholdStyle, When } from 'parser/core/ParseResults';
import AbilityTracker from 'parser/shared/modules/AbilityTracker';
import ItemManaGained from 'parser/ui/ItemManaGained';
import { getLowestPerf, QualitativePerformance } from 'parser/ui/QualitativePerformance';
import Statistic from 'parser/ui/Statistic';
import STATISTIC_CATEGORY from 'parser/ui/STATISTIC_CATEGORY';
import STATISTIC_ORDER from 'parser/ui/STATISTIC_ORDER';
import TalentSpellText from 'parser/ui/TalentSpellText';
import RenewingMistDuringManaTea from './RenewingMistDuringManaTea';
import { PerformanceMark } from 'interface/guide';
import { explanationAndDataSubsection } from 'interface/guide/components/ExplanationRow';
import {
  getManaTeaChannelDuration,
  getManaTeaStacksConsumed,
} from '../../normalizers/CastLinkNormalizer';

interface ManaTeaTracker {
  timestamp: number;
  manaSaved: number;
  totalVivifyCleaves: number;
  numVivifyCasts: number;
  overhealing: number;
  healing: number;
  stacksConsumed: number;
  manaRestored: number;
  channelTime: number;
}

class ManaTea extends Analyzer {
  static dependencies = {
    abilityTracker: AbilityTracker,
    renewingMistDuringManaTea: RenewingMistDuringManaTea,
  };

  protected renewingMistDuringManaTea!: RenewingMistDuringManaTea;

  manaSavedMT: number = 0;
  manaRestoredMT: number = 0;
  manateaCount: number = 0;
  casts: Map<string, number> = new Map<string, number>();
  castTrackers: ManaTeaTracker[] = [];
  effectiveHealing: number = 0;
  manaPerManaTeaGoal: number = 0;
  overhealing: number = 0;
  manaRestoredSinceLastApply: number = 0;
  protected abilityTracker!: AbilityTracker;

  constructor(options: Options) {
    super(options);
    this.active = this.selectedCombatant.hasTalent(TALENTS_MONK.MANA_TEA_TALENT);
    if (!this.active) {
      return;
    }
    this.manaPerManaTeaGoal = this.selectedCombatant.hasTalent(
      TALENTS_MONK.REFRESHING_JADE_WIND_TALENT,
    )
      ? 6700
      : 7500;

    this.addEventListener(Events.cast.by(SELECTED_PLAYER), this.handleCast);
    this.addEventListener(Events.heal.by(SELECTED_PLAYER), this.heal);
    this.addEventListener(
      Events.applybuff.by(SELECTED_PLAYER).spell(SPELLS.MANA_TEA_BUFF),
      this.onApplyBuff,
    );
    this.addEventListener(Events.heal.by(SELECTED_PLAYER).spell(SPELLS.VIVIFY), this.onVivHeal);
    this.addEventListener(Events.cast.by(SELECTED_PLAYER).spell(SPELLS.VIVIFY), this.onVivCast);
    this.addEventListener(
      Events.resourcechange.by(SELECTED_PLAYER).spell(SPELLS.MANA_TEA_CAST),
      this.onManaRestored,
    );
  }

  onApplyBuff(event: ApplyBuffEvent) {
    this.manateaCount += 1; //count the number of mana teas to make an average over teas
    this.castTrackers.push({
      timestamp: event.timestamp,
      totalVivifyCleaves: 0,
      numVivifyCasts: 0,
      manaSaved: 0,
      healing: 0,
      overhealing: 0,
      stacksConsumed: getManaTeaStacksConsumed(event),
      manaRestored: this.manaRestoredSinceLastApply,
      channelTime: getManaTeaChannelDuration(event),
    });
    this.manaRestoredSinceLastApply = 0;
  }

  heal(event: HealEvent) {
    if (this.selectedCombatant.hasBuff(SPELLS.MANA_TEA_BUFF.id)) {
      //if this is in a mana tea window
      this.effectiveHealing += (event.amount || 0) + (event.absorbed || 0);
      this.castTrackers.at(-1)!.healing += (event.amount || 0) + (event.absorbed || 0);
      this.castTrackers.at(-1)!.overhealing += event.overheal || 0;
      this.overhealing += event.overheal || 0;
    }
  }

  handleCast(event: CastEvent) {
    const name = event.ability.name;
    const manaEvent = event.classResources?.find(
      (resource) => resource.type === RESOURCE_TYPES.MANA.id,
    );
    if (manaEvent === undefined) {
      return;
    }

    if (
      this.selectedCombatant.hasBuff(SPELLS.MANA_TEA_BUFF.id) &&
      event.ability.guid !== TALENTS_MONK.MANA_TEA_TALENT.id
    ) {
      //we check both since melee doesn't havea classResource
      if (manaEvent.cost !== undefined) {
        //checks if the spell costs anything (we don't just use cost since some spells don't play nice)
        this.manaSavedMT += manaEvent.cost / 2;
        this.castTrackers.at(-1)!.manaSaved += manaEvent.cost / 2;
      }
      if (this.casts.has(name)) {
        this.casts.set(name, (this.casts.get(name) || 0) + 1);
      } else {
        this.casts.set(name, 1);
      }
    }
  }

  onVivCast(event: CastEvent) {
    if (!this.selectedCombatant.hasBuff(SPELLS.MANA_TEA_BUFF.id)) {
      return;
    }
    this.castTrackers.at(-1)!.totalVivifyCleaves -= 1; // this is overcounted in vivHeal func
    this.castTrackers.at(-1)!.numVivifyCasts += 1;
  }

  onVivHeal(event: HealEvent) {
    if (!this.selectedCombatant.hasBuff(SPELLS.MANA_TEA_BUFF.id)) {
      return;
    }
    this.castTrackers.at(-1)!.totalVivifyCleaves += 1;
  }

  onManaRestored(event: ResourceChangeEvent) {
    this.manaRestoredSinceLastApply += event.resourceChange;
    this.manaRestoredMT += event.resourceChange;
  }

  get avgMtSaves() {
    return this.manaSavedMT / this.manateaCount || 0;
  }

  get avgManaRestored() {
    return this.manaRestoredMT / this.manateaCount || 0;
  }

  get avgChannelDuration() {
    return (
      this.castTrackers.reduce((prev: number, cur: ManaTeaTracker) => prev + cur.channelTime, 0) /
      this.castTrackers.length
    );
  }

  get suggestionThresholds() {
    return {
      actual: this.avgMtSaves,
      isLessThan: {
        minor: this.manaPerManaTeaGoal,
        average: this.manaPerManaTeaGoal - 1000,
        major: this.manaPerManaTeaGoal - 2000,
      },
      style: ThresholdStyle.NUMBER,
    };
  }

  get avgOverhealing() {
    return parseFloat(
      (this.overhealing / (this.overhealing + this.effectiveHealing) || 0).toFixed(4),
    );
  }

  get suggestionThresholdsOverhealing() {
    return {
      actual: this.avgOverhealing,
      isGreaterThan: {
        minor: 0.2,
        average: 0.3,
        major: 0.4,
      },
      style: ThresholdStyle.PERCENTAGE,
    };
  }

  suggestions(when: When) {
    when(this.suggestionThresholds).addSuggestion((suggest, actual, recommended) =>
      suggest(
        <>
          Your mana spent during <SpellLink spell={TALENTS_MONK.MANA_TEA_TALENT} /> can be improved.
          Aim to prioritize as many <SpellLink spell={SPELLS.VIVIFY} /> casts until the last second
          of the buff and then cast <SpellLink spell={TALENTS_MONK.ESSENCE_FONT_TALENT} />.{' '}
          <SpellLink spell={TALENTS_MONK.ESSENCE_FONT_TALENT} />
          's mana cost is taken at the beginning of the channel, so you gain the benefit of{' '}
          <SpellLink spell={TALENTS_MONK.MANA_TEA_TALENT} /> even if the channel continues past the
          buff.
        </>,
      )
        .icon(TALENTS_MONK.MANA_TEA_TALENT.icon)
        .actual(
          `${formatNumber(this.avgMtSaves)}${defineMessage({
            id: 'monk.mistweaver.suggestions.manaTea.avgManaSaved',
            message: ` average mana saved per Mana Tea cast`,
          })}`,
        )
        .recommended(`${(recommended / 1000).toFixed(0)}k average mana saved is recommended`),
    );
    when(this.suggestionThresholdsOverhealing).addSuggestion((suggest, actual, recommended) =>
      suggest(
        <>
          Your average overhealing was high during your{' '}
          <SpellLink spell={TALENTS_MONK.MANA_TEA_TALENT} /> usage. Consider using{' '}
          <SpellLink spell={TALENTS_MONK.MANA_TEA_TALENT} /> during specific boss abilities or
          general periods of high damage to the raid. Also look to target low health raid members to
          avoid large amounts of overhealing.
        </>,
      )
        .icon(TALENTS_MONK.MANA_TEA_TALENT.icon)
        .actual(
          `${formatPercentage(this.avgOverhealing)}${defineMessage({
            id: 'monk.mistweaver.suggestions.manaTea.avgOverHealing',
            message: ` % average overhealing per Mana Tea cast`,
          })}`,
        )
        .recommended(`under ${formatPercentage(recommended)}% over healing is recommended`),
    );
  }

  getCastOverhealingPercent(cast: ManaTeaTracker) {
    return cast.overhealing / (cast.overhealing + cast.healing);
  }

  get guideCastBreakdown() {
    const explanationPercent = 55;
    const explanation = (
      <p>
        <strong>
          <SpellLink spell={TALENTS_MONK.MANA_TEA_TALENT} />
        </strong>{' '}
        is a powerful buff that can save a large amount of mana and doubles as a throughput cooldown
        once you obtain your 4 piece tier set bonus. Aim to maximize effectiveness of{' '}
        <SpellLink spell={TALENTS_MONK.MANA_TEA_TALENT} /> by spamming{' '}
        <SpellLink spell={SPELLS.VIVIFY} /> during damage moments when you have at least 8{' '}
        <SpellLink spell={TALENTS_MONK.RENEWING_MIST_TALENT} /> HoTs out on the raid.
        <br />
        Alternatively, If talented into{' '}
        <SpellLink spell={TALENTS_MONK.INVOKE_YULON_THE_JADE_SERPENT_TALENT} /> and{' '}
        <SpellLink spell={TALENTS_MONK.CLOUDED_FOCUS_TALENT} />, use{' '}
        <SpellLink spell={TALENTS_MONK.MANA_TEA_TALENT} /> toward the end of your celestial for a
        guaranteed proc of <SpellLink spell={SPELLS.SOULFANG_VITALITY} /> and spam
        <SpellLink spell={SPELLS.VIVIFY} /> while channeling{' '}
        <SpellLink spell={TALENTS_MONK.SOOTHING_MIST_TALENT} />.
      </p>
    );

    const data = (
      <div>
        <strong>Per-Cast Breakdown</strong>
        <small> - click to expand</small>
        {this.castTrackers.map((cast, ix) => {
          const header = (
            <>
              @ {this.owner.formatTimestamp(cast.timestamp)} &mdash;{' '}
              <SpellLink spell={TALENTS_MONK.MANA_TEA_TALENT} />
            </>
          );
          const checklistItems: CooldownExpandableItem[] = [];
          let manaPerf = QualitativePerformance.Good;
          if (cast.manaSaved < 20000) {
            manaPerf = QualitativePerformance.Ok;
          } else if (cast.manaSaved < 15000) {
            manaPerf = QualitativePerformance.Fail;
          }
          checklistItems.push({
            label: (
              <>
                Mana saved during <SpellLink spell={TALENTS_MONK.MANA_TEA_TALENT} />
              </>
            ),
            result: <PerformanceMark perf={manaPerf} />,
            details: <>{formatNumber(cast.manaSaved)}</>,
          });
          const overhealingPercent = this.getCastOverhealingPercent(cast);
          let overhealingPerf = QualitativePerformance.Good;
          if (overhealingPercent > 0.65) {
            overhealingPerf = QualitativePerformance.Fail;
          } else if (overhealingPercent > 0.55) {
            overhealingPerf = QualitativePerformance.Ok;
          }
          checklistItems.push({
            label: (
              <>
                Overhealing during <SpellLink spell={TALENTS_MONK.MANA_TEA_TALENT} />
              </>
            ),
            result: <PerformanceMark perf={overhealingPerf} />,
            details: <>{formatPercentage(overhealingPercent)}%</>,
          });
          const allPerfs = [manaPerf, overhealingPerf];
          if (cast.numVivifyCasts > 0) {
            const avgCleaves = cast.totalVivifyCleaves / cast.numVivifyCasts;
            let vivCleavePerf = QualitativePerformance.Good;
            if (avgCleaves < 8) {
              vivCleavePerf = QualitativePerformance.Ok;
            } else if (avgCleaves < 6) {
              vivCleavePerf = QualitativePerformance.Fail;
            }
            checklistItems.push({
              label: (
                <>
                  Avg <SpellLink spell={SPELLS.VIVIFY} /> cleaves per cast
                </>
              ),
              result: <PerformanceMark perf={vivCleavePerf} />,
              details: <>{avgCleaves.toFixed(1)}</>,
            });
            allPerfs.push(vivCleavePerf);
          }

          const lowestPerf = getLowestPerf(allPerfs);
          return (
            <CooldownExpandable
              header={header}
              checklistItems={checklistItems}
              perf={lowestPerf}
              key={ix}
            />
          );
        })}
      </div>
    );

    return explanationAndDataSubsection(explanation, data, explanationPercent);
  }

  get totalManaSaved() {
    return this.manaSavedMT + this.manaRestoredMT;
  }

  get avgStacks() {
    return (
      this.castTrackers.reduce(
        (prev: number, cur: ManaTeaTracker) => prev + cur.stacksConsumed,
        0,
      ) / this.castTrackers.length
    );
  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.CORE(9)}
        size="flexible"
        category={STATISTIC_CATEGORY.TALENTS}
        tooltip={
          <>
            <div>Total mana saved: {formatNumber(this.manaSavedMT)}</div>
            <div>Total mana restored: {formatNumber(this.manaRestoredMT)}</div>
            <div>
              Average <SpellLink spell={TALENTS_MONK.MANA_TEA_TALENT} /> stacks:{' '}
              {formatNumber(this.avgStacks)}
            </div>
            <div>Average channel duration: {(this.avgChannelDuration / 1000).toFixed(1)}s</div>
          </>
        }
      >
        <TalentSpellText talent={TALENTS_MONK.MANA_TEA_TALENT}>
          <div>
            <ItemManaGained amount={this.totalManaSaved} useAbbrev />
          </div>
          <div>
            <TooltipElement
              content={
                <>
                  This is the mana saved from the mana reduction provided by{' '}
                  <SpellLink spell={SPELLS.MANA_TEA_CAST} />
                </>
              }
            >
              {formatNumber(this.avgMtSaves)} <small>mana saved per cast</small>
            </TooltipElement>
          </div>
          <div>
            <TooltipElement
              content={
                <>
                  This is the mana restored from channeling{' '}
                  <SpellLink spell={SPELLS.MANA_TEA_CAST} />
                </>
              }
            >
              {formatNumber(this.avgManaRestored)} <small> mana restored per cast</small>
            </TooltipElement>
          </div>
          <div>{this.renewingMistDuringManaTea.subStatistic()}</div>
        </TalentSpellText>
      </Statistic>
    );
  }
}

export default ManaTea;
