import { change, date } from 'common/changelog';
import SPELLS from 'common/SPELLS';
import TALENTS from 'common/TALENTS/mage';
import { SpellLink } from 'interface';
import { Sharrq, ToppleTheNun } from 'CONTRIBUTORS';

// prettier-ignore
export default [
  change(date(2023, 8, 2), <>Marked the spec supported for 10.1.5</>, Sharrq),
  change(date(2023, 8, 2), <>Added support for <SpellLink spell={TALENTS.UNLEASHED_INFERNO_TALENT} /></>, Sharrq),
  change(date(2023, 8, 2), <>Added tracking for wasted <SpellLink spell={SPELLS.HOT_STREAK} /> uses while <SpellLink spell={TALENTS.SUN_KINGS_BLESSING_TALENT} /> was ready</>, Sharrq),
  change(date(2023, 8, 2), <>Updated <SpellLink spell={TALENTS.FEEL_THE_BURN_TALENT} /> tracking</>, Sharrq),
  change(date(2023, 8, 2), <>Added support for <SpellLink spell={SPELLS.CHARRING_EMBERS_DEBUFF} /></>, Sharrq),
  change(date(2023, 8, 2), <>Removed <SpellLink spell={TALENTS.PHOENIX_FLAMES_TALENT} /> Pooling</>, Sharrq),
  change(date(2023, 8, 2), <>Added support for <SpellLink spell={SPELLS.CHARRING_EMBERS_DEBUFF} /></>, Sharrq),
  change(date(2023, 7, 10), 'Remove references to 10.1.5 removed talents.', Sharrq),
  change(date(2023, 7, 3), 'Update SpellLink usage.', ToppleTheNun),
  change(date(2023, 6, 27), <>Added <SpellLink spell={TALENTS.TEMPORAL_WARP_TALENT} /> to list of Bloodlust Buffs.</>, Sharrq),
  change(date(2023, 2, 12), <>Marked the spec supported for 10.0.5</>, Sharrq),
  change(date(2022, 12, 13), <>Removed references to Infernal Cascade and replaced with <SpellLink spell={TALENTS.FEEL_THE_BURN_TALENT} /> functionality.</>, Sharrq),
  change(date(2022, 12, 13), <>Fixed <SpellLink spell={TALENTS.SHIFTING_POWER_TALENT} /> functionality.</>, Sharrq),
  change(date(2022, 12, 13), `General fixes for incorrect Spell IDs, leftover Shadowlands spells, etc.`, Sharrq),
  change(date(2022, 11, 13), `Initial pass on Dragonflight Compatability.`, Sharrq),
  change(date(2022, 11, 8), 'Remove Shadowlands covenant abilities from checklist.', ToppleTheNun),
  change(date(2022, 10, 30), `Update Dragonflight SPELLS, Abilities, and Buffs`, Sharrq),
  change(date(2022, 10, 9), 'Initial Dragonflight support', Sharrq),
];
