import SPELLS from 'common/SPELLS/classic/warlock';
import CoreCooldownThroughputTracker, {
  BUILT_IN_SUMMARY_TYPES,
} from 'parser/shared/modules/CooldownThroughputTracker';

class CooldownThroughputTracker extends CoreCooldownThroughputTracker {
  static castCooldowns = [
    ...CoreCooldownThroughputTracker.castCooldowns,
    {
      spell: SPELLS.METAMORPHOSIS.id,
      summary: [BUILT_IN_SUMMARY_TYPES.DAMAGE],
    },
    {
      spell: SPELLS.DEMON_SOUL.id,
      summary: [BUILT_IN_SUMMARY_TYPES.DAMAGE],
      duration: 20,
    },
  ];
}

export default CooldownThroughputTracker;
