// Base files
import BaseCombatLogParser from 'parser/classic/CombatLogParser';
// Shared
import ManaTracker from 'parser/core/healingEfficiency/ManaTracker';
import SpellManaCost from 'parser/shared/modules/SpellManaCost';
// Modules
import Abilities from './modules/Abilities';
import Buffs from './modules/Buffs';
import CooldownThroughputTracker from './modules/features/CooldownThroughputTracker';
import FoundationGuide from 'interface/guide/foundation/FoundationGuide';
import CancelledCasts from 'parser/shared/modules/CancelledCasts';
import MetamorphosisNormalizer from './modules/normalizers/MetamorphosisNormalizer';
import DemonSoulNormalizer from './modules/normalizers/DemonSoulNormalizer';
// Spells
//import spellName from './modules/spells';

class CombatLogParser extends BaseCombatLogParser {
  static specModules = {
    // Shared
    manaTracker: ManaTracker,
    spellManaCost: SpellManaCost,
    // Modules
    abilities: Abilities,
    buffs: Buffs,
    cancelledCasts: CancelledCasts,
    cooldownThroughputTracker: CooldownThroughputTracker,
    // Spells
    // spellname: Spell,
    // Normalizers
    metamorphosisNormalizer: MetamorphosisNormalizer,
    demonSoulNormalizer: DemonSoulNormalizer,
  };
  static guide = FoundationGuide;
}

export default CombatLogParser;
