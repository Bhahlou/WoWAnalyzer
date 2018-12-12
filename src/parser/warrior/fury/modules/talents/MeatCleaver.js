import React from 'react';
import TalentStatisticBox from 'interface/others/TalentStatisticBox';
import Analyzer from 'parser/core/Analyzer';
import Events from 'parser/core/Events';
import { SELECTED_PLAYER } from 'parser/core/EventFilter';
import SPELLS from 'common/SPELLS';

const BUFFER_MS = 50;

class MeatCleaver extends Analyzer {
  whirlwindEvents = [];
  lastWhirlwindCast = 0;

  constructor(...args) {
    super(...args);
    this.active = this.selectedCombatant.hasTalent(SPELLS.MEAT_CLEAVER_TALENT.id);
    if (!this.active) {
      return;
    }

    this.addEventListener(Events.energize.to(SELECTED_PLAYER).spell(SPELLS.WHIRLWIND_FURY_ENERGIZE), this.onWhirlwindEnergize);
    this.addEventListener(Events.damage.by(SELECTED_PLAYER).spell([SPELLS.WHIRLWIND_FURY_DAMAGE_MH, SPELLS.WHIRLWIND_FURY_DAMAGE_OH]), this.onWhirlwindDamage);
    this.addEventListener(Events.applybuff.to(SELECTED_PLAYER).spell(SPELLS.ENRAGE), this.onEnrage);
  }

  // The Energize event ligns up with the cast, so using it for both the rage gain, and timings of the cast.
  onWhirlwindEnergize(event) {
    this.lastWhirlwindCast = event.timestamp;
    this.whirlwindEvents[this.lastWhirlwindCast] = {
      resourceChange: event.resourceChange,
      triggeredEnrage: false,
      targetsHit: 0,
      isFirstRoundOfDamage: true,
      hasRecklessness: this.selectedCombatant.hasBuff(SPELLS.RECKLESSNESS.id),
    };
  }

  onEnrage(event) {
    if (event.timestamp - this.lastWhirlwindCast <= BUFFER_MS) {
      this.whirlwindEvents[this.lastWhirlwindCast].triggeredEnrage = true;
    }
  }

  onWhirlwindDamage(event) {
    // Whirlwind triggers damage 3 times. We only need to count the number of targets hit on the first set of MH damage
    if (this.whirlwindEvents[this.lastWhirlwindCast].isFirstRoundOfDamage) {
      if (event.ability.guid === SPELLS.WHIRLWIND_FURY_DAMAGE_MH.id) {
        this.whirlwindEvents[this.lastWhirlwindCast].targetsHit++;
      } else {
        this.whirlwindEvents[this.lastWhirlwindCast].isFirstRoundOfDamage = false;
      }
    }
  }

  get numberOfEnrageTriggers() {
    return this.whirlwindEvents.filter(e => e.triggeredEnrage).length;
  }

  get rageGainedByMeatCleaver() {
    return this.whirlwindEvents.reduce((total, event) => {
      const rageGained = event.resourceChange;
      const rageFromHit = rageGained - (event.hasRecklessness ? 6 : 3);
      const rageFromMeatCleaver = rageFromHit - (event.targetsHit > 5 ? 5 : event.targetsHit) * (event.hasRecklessness ? 2 : 1);
      return total + rageFromMeatCleaver;
    }, 0);
  }

  statistic() {
    return (
      <TalentStatisticBox
        talent={SPELLS.MEAT_CLEAVER_TALENT.id}
        value={`${this.rageGainedByMeatCleaver} rage gained`}
        label="Meat Cleaver"
        tooltip={`Enrage was triggered <b>${this.numberOfEnrageTriggers}</b> times by Meat Cleaver.`}
        />
    );
  }
}

export default MeatCleaver;