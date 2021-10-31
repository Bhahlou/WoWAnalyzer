import { t } from '@lingui/macro';
import { formatPercentage } from 'common/format';
import SPELLS from 'common/SPELLS';
import { SpellLink } from 'interface';
import Analyzer, { Options, SELECTED_PLAYER } from 'parser/core/Analyzer';
import Events, { ResourceChangeEvent } from 'parser/core/Events';
import { ThresholdStyle, When } from 'parser/core/ParseResults';
import React from 'react';

import ConvokeSpiritsFeral from '../../modules/shadowlands/ConvokeSpiritsFeral';

class TigersFuryEnergy extends Analyzer {
  static dependencies = {
    convokeSpiritsFeral: ConvokeSpiritsFeral,
  };

  convokeSpiritsFeral!: ConvokeSpiritsFeral;

  energyGenerated: number = 0;
  energyWasted: number = 0;
  energyTotal: number = 0;

  energyGeneratedNoConvoke: number = 0;
  energyWastedNoConvoke: number = 0;
  energyTotalNoConvoke: number = 0;

  constructor(options: Options) {
    super(options);

    this.addEventListener(
      Events.resourcechange.by(SELECTED_PLAYER).spell(SPELLS.TIGERS_FURY),
      this.onTigersFuryEnergize,
    );
  }

  onTigersFuryEnergize(event: ResourceChangeEvent) {
    const total = event.resourceChange;
    const waste = event.waste;

    this.energyGenerated += total - waste;
    this.energyWasted += waste;
    this.energyTotal += total;

    if (!this.convokeSpiritsFeral.isConvoking()) {
      this.energyGeneratedNoConvoke += total - waste;
      this.energyWastedNoConvoke += waste;
      this.energyTotalNoConvoke += total;
    }
  }

  get percentWastedNoConvoke() {
    return this.energyWastedNoConvoke / this.energyTotalNoConvoke || 0;
  }

  get suggestionThresholds() {
    return {
      actual: this.percentWastedNoConvoke,
      isGreaterThan: {
        minor: 0,
        average: 0.1,
        major: 0.25,
      },
      style: ThresholdStyle.PERCENTAGE,
    };
  }

  suggestions(when: When) {
    when(this.suggestionThresholds).addSuggestion((suggest, actual, recommended) =>
      suggest(
        <>
          You are wasting energy generated by <SpellLink id={SPELLS.TIGERS_FURY.id} />. Spend down
          your energy before using <SpellLink id={SPELLS.TIGERS_FURY.id} /> to avoid waste.
          {this.convokeSpiritsFeral.active && (
            <>
              {' '}
              These numbers count only hardcast Tiger's Fury, and do not consider those procced by{' '}
              <SpellLink id={SPELLS.CONVOKE_SPIRITS.id} />, as waste from these procs is generally
              unavoidable.
            </>
          )}
        </>,
      )
        .icon(SPELLS.TIGERS_FURY.icon)
        .actual(
          t({
            id: 'druid.feral.suggestions.tigerFuryEnergy.energyWasted',
            message: `${formatPercentage(actual, 0)}% of generated energy wasted.`,
          }),
        )
        .recommended(`No waste is recommended`),
    );
  }
}

export default TigersFuryEnergy;
