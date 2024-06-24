import { defineMessage, Trans } from '@lingui/macro';
import { formatPercentage } from 'common/format';
import Analyzer from 'parser/core/Analyzer';
import { ThresholdStyle, When } from 'parser/core/ParseResults';
import Enemies from 'parser/shared/modules/Enemies';

import { SpellLink } from 'interface';
import SPELLS from 'common/SPELLS/classic';
import { SPELL_COLORS } from '../../constants';
import BaneOfAgony from '../spells/BaneOfAgony';
import BaneOfDoom from '../spells/BaneOfDoom';
import CurseOfTheElements from '../spells/CurseOfTheElements';

import Statistic from 'parser/ui/Statistic';
import STATISTIC_ORDER from 'parser/ui/STATISTIC_ORDER';
import DonutChart from 'parser/ui/DonutChart';
import { PerformanceRoundedPanel, SideBySidePanels } from 'interface/guide/components/GuideDivs';
import { QualitativePerformance } from 'parser/ui/QualitativePerformance';

class CurseUptime extends Analyzer {
  static dependencies = {
    enemies: Enemies,
    BaneOfAgony: BaneOfAgony,
    BaneOfDoom: BaneOfDoom,
    curseOfTheElements: CurseOfTheElements,
  };
  protected enemies!: Enemies;
  protected BaneOfAgony!: BaneOfAgony;
  protected BaneOfDoom!: BaneOfDoom;
  protected curseOfTheElements!: CurseOfTheElements;

  get uptime() {
    return (
      (this.enemies.getBuffUptime(SPELLS.BANE_OF_AGONY.id) +
        this.enemies.getBuffUptime(SPELLS.BANE_OF_DOOM.id) +
        this.enemies.getBuffUptime(SPELLS.CURSE_OF_THE_ELEMENTS.id)) /
      this.owner.fightDuration
    );
  }

  get suggestionThresholds() {
    return {
      actual: this.uptime,
      isLessThan: {
        minor: 0.9,
        average: 0.85,
        major: 0.8,
      },
      style: ThresholdStyle.PERCENTAGE,
    };
  }

  get DowntimePerformance(): QualitativePerformance {
    const suggestionThresholds = this.suggestionThresholds.isLessThan;
    if (this.uptime >= 1) {
      return QualitativePerformance.Perfect;
    }
    if (this.uptime >= suggestionThresholds.minor) {
      return QualitativePerformance.Good;
    }
    if (this.uptime >= suggestionThresholds.average) {
      return QualitativePerformance.Ok;
    }
    return QualitativePerformance.Fail;
  }

  suggestions(when: When) {
    when(this.suggestionThresholds).addSuggestion((suggest, actual, recommended) =>
      suggest(
        <span>
          <Trans id="warlock.wotlk.suggestions.curse.description">
            Your curse uptime can be improved.
          </Trans>
        </span>,
      )
        .icon('classicon_warlock')
        .actual(
          defineMessage({
            id: 'warlock.wotlk.suggestions.curse.uptime',
            message: `${formatPercentage(actual)}% Curse uptime`,
          }),
        )
        .recommended(`>${formatPercentage(recommended)}% is recommended`),
    );
  }

  get curseChart() {
    const items = [];
    const coeUptime = this.curseOfTheElements.uptime;
    const coaUptime = this.BaneOfAgony.uptime;
    const codUptime = this.BaneOfDoom.uptime;
    const downtime = 1 - this.uptime;

    if (coeUptime > 0) {
      items.push({
        color: SPELL_COLORS.CURSE_OF_THE_ELEMENTS,
        label: 'Curse of the Elements',
        spellId: SPELLS.CURSE_OF_THE_ELEMENTS.id,
        value: coeUptime,
        valueTooltip: formatPercentage(coeUptime),
      });
    }
    if (coaUptime > 0) {
      items.push({
        color: SPELL_COLORS.BANE_OF_AGONY,
        label: 'Bane Of Agony',
        spellId: SPELLS.BANE_OF_AGONY.id,
        value: coaUptime,
        valueTooltip: formatPercentage(coaUptime),
      });
    }
    if (codUptime > 0) {
      items.push({
        color: SPELL_COLORS.BANE_OF_DOOM,
        label: 'Bane Of Doom',
        spellId: SPELLS.BANE_OF_DOOM.id,
        value: codUptime,
        valueTooltip: formatPercentage(codUptime),
      });
    }
    if (downtime > 0) {
      items.push({
        color: SPELL_COLORS.DOWNTIME,
        label: 'Curse Downtime',
        value: downtime,
        valueTooltip: formatPercentage(downtime),
      });
    }

    return <DonutChart items={items} />;
  }

  get totalChart() {
    const items = [
      {
        color: SPELL_COLORS.UPTIME,
        label: 'Uptime',
        value: this.uptime,
        valueTooltip: formatPercentage(this.uptime),
      },
      {
        color: SPELL_COLORS.DOWNTIME,
        label: 'Downtime',
        value: 1 - this.uptime,
        valueTooltip: formatPercentage(1 - this.uptime),
      },
    ];

    return <DonutChart items={items} />;
  }

  statistic() {
    return (
      <Statistic position={STATISTIC_ORDER.CORE(1)} size="flexible">
        <div className="pad">
          <label>Total Curse Uptime - {formatPercentage(this.uptime)}%</label>
          {this.curseChart}
        </div>
      </Statistic>
    );
  }

  get guideSubsection() {
    return (
      <>
        <p>
          It is important to maintain a curse on the primary target. If there is no Unholy DK
          (applying <SpellLink spell={SPELLS.EBON_PLAGUE} />) or Moonkin (applying{' '}
          <SpellLink spell={SPELLS.EARTH_AND_MOON} />) in the raid, use{' '}
          <SpellLink spell={SPELLS.CURSE_OF_THE_ELEMENTS} />. After the priority curse
          consideration, use <SpellLink spell={SPELLS.BANE_OF_DOOM} /> for a target alive more than
          a minute or <SpellLink spell={SPELLS.BANE_OF_AGONY} /> for a target alive less than a
          minute.
        </p>
        <SideBySidePanels>
          <PerformanceRoundedPanel performance={this.DowntimePerformance}>
            <strong>Curse Totals</strong>
            {this.totalChart}
          </PerformanceRoundedPanel>
          <PerformanceRoundedPanel performance={this.DowntimePerformance}>
            <strong>Curse Breakdown</strong>
            {this.curseChart}
          </PerformanceRoundedPanel>
        </SideBySidePanels>
      </>
    );
  }
}

export default CurseUptime;
