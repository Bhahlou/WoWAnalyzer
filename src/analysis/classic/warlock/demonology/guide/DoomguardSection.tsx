import { SpellLink } from 'interface';
import SPELLS from 'common/SPELLS/classic';
import { GuideProps, Section, SubSection } from 'interface/guide';
import CombatLogParser from '../CombatLogParser';
import { FoundationHighlight as HL } from 'interface/guide/foundation/shared';

export function DoomguardSection({ modules, events, info }: GuideProps<typeof CombatLogParser>) {
  //const rageWindows = Object.values(modules.dragonRage.rageWindowCounters);
  return (
    <Section title="Summon and buff your doomguard">
      <p>
        <SpellLink spell={SPELLS.SUMMON_DOOMGUARD} /> is your most powerful damage cooldown, and
        contributes to a large portion of your DPS. <br />
        In most of fights, you can use this cooldown only once per fight, due to its 10 mins
        cooldown, and it lasts for 1:05 mins (45s base duration + 20s thanks to{' '}
        <SpellLink spell={SPELLS.ANCIENT_GRIMOIRE} /> talent)
        <br />
      </p>
      <p>
        What makes <SpellLink spell={SPELLS.SUMMON_DOOMGUARD} /> very strong is its{' '}
        <strong>snapshot mechanism</strong>:<br />
        When you summon your doomguard, it snapshots spellpower, haste <strong>rating</strong> (such
        as <SpellLink spell={SPELLS.HURRICANE_BUFF} /> and{' '}
        <SpellLink spell={SPELLS.ESSENCE_OF_THE_RED} />) and mastery you have when it is summoned,
        meaning that{' '}
        <HL>doomguard get benefits of the procs you have at cast for its entire duration</HL>! It is
        worth nothing that speed cast buffs (like <SpellLink spell={SPELLS.BLOODLUST} />,{' '}
        <SpellLink spell={SPELLS.HEROISM} /> or <SpellLink spell={SPELLS.POWER_INFUSION} />
        )are not snapshoted .<br />
      </p>
      <p>
        This means that to get full benefits of this mechanism, you want to have as many procs as
        possible, and this is why as a general rule of thumb, it is usually best to summon your
        doomguard few seconds after the pull, when all your trinkets and procs are available.
      </p>

      <SubSection title="Doomguard Snapshot Report">
        <p>
          Summoned demon:
          {modules.doomguard.doomguardSummonData.summonedDemonSummary}
          <br />
          Snapshot quality:
          {modules.doomguard.snapshotQualityEntries.map((entry) => {
            return entry.snapshotSummary;
          })}
          {modules.doomguard.snapshotAdvice}
        </p>
      </SubSection>
    </Section>
  );
}
