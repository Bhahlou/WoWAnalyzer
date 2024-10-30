import { SpellLink } from 'interface';
import SPELLS from 'common/SPELLS/classic';
import { GuideProps, Section, SubSection } from 'interface/guide';
import CombatLogParser from '../CombatLogParser';
import { FoundationHighlight as HL } from 'interface/guide/foundation/shared';

export function DoomguardSection({ modules, events, info }: GuideProps<typeof CombatLogParser>) {
  function SnapshotQuality() {
    if (modules.doomguard.doomguardSummonData.doomguard.summonTimestamp !== 0) {
      return (
        <>
          Snapshot quality:
          {modules.doomguard.snapshotQualityEntries.map((entry) => {
            return entry.snapshotSummary;
          })}
          {modules.doomguard.snapshotAdvice}
        </>
      );
    } else {
      return <></>;
    }
  }

  return (
    <Section title="Summon and buff your doomguard">
      <p>
        <SpellLink spell={SPELLS.SUMMON_DOOMGUARD} /> is your most powerful damage cooldown, and
        contributes to a large portion of your DPS. Due to the 10 minute cooldown, your goal on most
        fights is to get <strong>one good cast</strong> for the full 1m 5s duration.
      </p>
      <p>
        <strong>Snapshotting</strong>
      </p>
      <p>
        <SpellLink spell={SPELLS.SUMMON_DOOMGUARD} /> snapshots your stat ratings when it is cast,{' '}
        <strong>including buffs!</strong>{' '}
        <HL>
          This allows your Doomguard to benefit from <em>short buffs</em> for its entire duration.
        </HL>
      </p>
      <p>
        <small>
          <strong>Haste rating buffs</strong> like <SpellLink spell={SPELLS.HURRICANE_BUFF} /> and{' '}
          <SpellLink spell={SPELLS.ESSENCE_OF_THE_RED} /> are snapshotted but{' '}
          <strong>Cast speed buffs</strong> like <SpellLink spell={SPELLS.BLOODLUST} />,{' '}
          <SpellLink spell={SPELLS.HEROISM} /> or <SpellLink spell={SPELLS.POWER_INFUSION} /> are
          not.
        </small>
      </p>
      <p>
        Snapshotting is important to doing good damage as Demonology. The easiest way to get a good
        snapshot is to{' '}
        <HL>
          summon your Doomguard shortly after pull, while all trinkets and enchants are active.
        </HL>
      </p>

      <SubSection title="Doomguard Snapshot Report">
        <p>
          Summoned demon:
          {modules.doomguard.doomguardSummonData.summonedDemonSummary}
          <br />
          <SnapshotQuality />
        </p>
      </SubSection>
    </Section>
  );
}
