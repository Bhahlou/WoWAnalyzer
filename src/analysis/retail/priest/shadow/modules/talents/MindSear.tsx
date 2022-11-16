import { t } from '@lingui/macro';
import AbilityTracker from 'analysis/retail/priest/shadow/modules/core/AbilityTracker';
import { formatNumber } from 'common/format';
import SPELLS from 'common/SPELLS';
import { SpellLink } from 'interface';
import Analyzer, { Options, SELECTED_PLAYER } from 'parser/core/Analyzer';
import Events, { DamageEvent } from 'parser/core/Events';
import { ThresholdStyle, When } from 'parser/core/ParseResults';
import BoringSpellValueText from 'parser/ui/BoringSpellValueText';
import ItemDamageDone from 'parser/ui/ItemDamageDone';
import Statistic from 'parser/ui/Statistic';
import STATISTIC_CATEGORY from 'parser/ui/STATISTIC_CATEGORY';

class MindSear extends Analyzer {
  static dependencies = {
    abilityTracker: AbilityTracker,
  };
  protected abilityTracker!: AbilityTracker;

  damage = 0;
  totalTargetsHit = 0;

  constructor(options: Options) {
    super(options);
    this.active = this.selectedCombatant.hasTalent(SPELLS.MIND_SEAR.id);
    this.addEventListener(Events.damage.by(SELECTED_PLAYER).spell(SPELLS.MIND_SEAR), this.onDamage);
  }

  get averageTargetsHit() {
    return this.totalTargetsHit / this.abilityTracker.getAbility(SPELLS.MIND_SEAR.id).casts || 0;
  }

  onDamage(event: DamageEvent) {
    this.totalTargetsHit += 1;
    this.damage += event.amount + (event.absorbed || 0);
  }

  get suggestionThresholds() {
    return {
      actual: this.averageTargetsHit,
      isLessThan: {
        minor: 4,
        average: 3.5,
        major: 3,
      },
      style: ThresholdStyle.NUMBER,
    };
  }

  suggestions(when: When) {
    when(this.suggestionThresholds).addSuggestion((suggest, actual, recommended) =>
      suggest(
        <>
          You hit an average of {formatNumber(actual)} targets with{' '}
          <SpellLink id={SPELLS.MIND_SEAR.id} />. Using <SpellLink id={SPELLS.MIND_SEAR.id} /> below{' '}
          {formatNumber(recommended)} targets is not worth it and you will get more damage value
          from your insanity with <SpellLink id={SPELLS.DEVOURING_PLAGUE.id} />. If you are not
          getting enough hits or casts from this talent, you will likely benefit more from a
          different one.
        </>,
      )
        .icon(SPELLS.MIND_SEAR.icon)
        .actual(
          t({
            id: 'priest.shadow.suggestions.MIND_SEAR.efficiency',
            message: `Hit an average of ${formatNumber(actual)} targets with Mind Sear.`,
          }),
        )
        .recommended(`>=${recommended} is recommended.`),
    );
  }

  statistic() {
    return (
      <Statistic
        category={STATISTIC_CATEGORY.TALENTS}
        size="flexible"
        tooltip={`Average targets hit: ${formatNumber(this.averageTargetsHit)}`}
      >
        <BoringSpellValueText spellId={SPELLS.MIND_SEAR.id}>
          <>
            <ItemDamageDone amount={this.damage} />
          </>
        </BoringSpellValueText>
      </Statistic>
    );
  }
}

export default MindSear;