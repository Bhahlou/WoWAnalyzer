import { GuideProps, Section, SubSection } from 'interface/guide';
import CombatLogParser from 'analysis/retail/druid/feral/CombatLogParser';
import { TALENTS_DRUID } from 'common/TALENTS';
import { CooldownBar } from 'parser/ui/CooldownBar';
import SPELLS from 'common/SPELLS';
import { SpellLink, TooltipElement } from 'interface';

export default function Guide({ modules, events, info }: GuideProps<typeof CombatLogParser>) {
  return (
    <>
      <Section title="Resource Use">
        <SubSection title="Energy">
          <p>
            Feral's primary resource is Energy. Typically, ability use will be limited by energy,
            not time. You should avoid capping energy - lost energy regeneration is lost DPS. It
            will occasionally be impossible to avoid capping energy - like while handling mecahnics
            or during intermission phases.
          </p>
          TODO ENERGY GRAPH w/ HIGHLIGHTED CAPPED ENERGY, TIMES OFF TARGET (NO MELEE)
        </SubSection>
        <SubSection title="Combo Points">
          <p>
            Feral uses a system of Combo Point builders and spenders. Spenders are always more
            powerful than builders - when you reach maximum combo points you should always use a
            spender.
          </p>
          TODO LIST OF BUILDERS w/ GENERATED vs WASTED (OVERCAP)
          <br />
          TODO LIST OF SPENDERS w/ LOW CP USAGE
        </SubSection>
      </Section>
      <CoreRotationSection modules={modules} events={events} info={info} />
      <Section title="Cooldowns">
        <p>TODO COOLDOWN USAGE DESCRIPTION</p>
        <CooldownGraphSubsection modules={modules} events={events} info={info} />
      </Section>
    </>
  );
}

function CoreRotationSection({ modules, events, info }: GuideProps<typeof CombatLogParser>) {
  return (
    <Section title="Core Rotation">
      <p>
        Feral's core rotation involves performing <strong>builder</strong> abilites up to 5 combo
        points, then using a <strong>spender</strong> ability. Maintain your damage over time
        effects on targets, then fill with your direct damage abilities. Refer to the spec guide for{' '}
        <a
          href="https://www.wowhead.com/feral-druid-rotation-guide"
          target="_blank"
          rel="noopener noreferrer"
        >
          rotation details
        </a>
        . See below for spell usage details.
      </p>
      {modules.bloodtalons.guideSubsection}
      {modules.rakeUptime.guideSubsection}
      {info.combatant.hasTalent(TALENTS_DRUID.LUNAR_INSPIRATION_TALENT) && (
        <SubSection>
          <strong>
            <SpellLink id={SPELLS.MOONFIRE_FERAL.id} />
          </strong>{' '}
          - Maintain uptime, preferably with{' '}
          <TooltipElement content={snapshotTooltip()}>snapshots</TooltipElement>
          {modules.moonfireUptime.subStatistic()}
        </SubSection>
      )}
      <SubSection>
        <strong>
          <SpellLink id={SPELLS.SWIPE_CAT.id} /> and <SpellLink id={SPELLS.THRASH_FERAL.id} />
        </strong>{' '}
        - TODO targets hit eval (check for bloodtalons contrib)
      </SubSection>
      {modules.ripUptime.guideSubsection}
      <SubSection>
        <strong>
          <SpellLink id={SPELLS.FEROCIOUS_BITE.id} />
        </strong>{' '}
        - TODO eval? Per-cast (snapshot, use full energy)
        <br />
        Apex predator usage?
      </SubSection>
      {info.combatant.hasTalent(TALENTS_DRUID.ADAPTIVE_SWARM_SHARED_TALENT) && (
        <SubSection>
          <strong>
            <SpellLink id={TALENTS_DRUID.ADAPTIVE_SWARM_SHARED_TALENT.id} />
          </strong>{' '}
          - ???
          {modules.adaptiveSwarm.subStatistic()}
        </SubSection>
      )}
    </Section>
  );
}

function snapshotTooltip() {
  return (
    <>
      Your damage over time abilities 'snapshot' some of your buffs, retaining their damage bonus
      over the DoTs full duration, even if the buff fades. The buffs that snapshot are{' '}
      <SpellLink id={TALENTS_DRUID.TIGERS_FURY_TALENT.id} />,{' '}
      <SpellLink id={TALENTS_DRUID.BLOODTALONS_TALENT.id} />, and{' '}
      <SpellLink id={TALENTS_DRUID.POUNCING_STRIKES_TALENT.id} />
    </>
  );
}

function CooldownGraphSubsection({ modules, events, info }: GuideProps<typeof CombatLogParser>) {
  const hasBerserk = info.combatant.hasTalent(TALENTS_DRUID.BERSERK_TALENT);
  const hasIncarn = info.combatant.hasTalent(TALENTS_DRUID.INCARNATION_AVATAR_OF_ASHAMANE_TALENT);
  const hasConvoke = info.combatant.hasTalent(TALENTS_DRUID.CONVOKE_THE_SPIRITS_SHARED_TALENT);
  const hasFeralFrenzy = info.combatant.hasTalent(TALENTS_DRUID.FERAL_FRENZY_TALENT);
  return (
    <SubSection>
      <strong>Cooldown Graph</strong> - this graph shows when you used your cooldowns and how long
      you waited to use them again. Grey segments show when the spell was available, yellow segments
      show when the spell was cooling down. Red segments highlight times when you could have fit a
      whole extra use of the cooldown.
      <div className="flex-main chart" style={{ padding: 5 }}>
        <CooldownBar spellId={SPELLS.TIGERS_FURY.id} events={events} info={info} highlightGaps />
      </div>
      {hasBerserk && !hasIncarn && (
        <div className="flex-main chart" style={{ padding: 5 }}>
          <CooldownBar spellId={SPELLS.BERSERK.id} events={events} info={info} highlightGaps />
        </div>
      )}
      {hasIncarn && (
        <div className="flex-main chart" style={{ padding: 5 }}>
          <CooldownBar
            spellId={TALENTS_DRUID.INCARNATION_AVATAR_OF_ASHAMANE_TALENT.id}
            events={events}
            info={info}
            highlightGaps
          />
        </div>
      )}
      {hasConvoke && (
        <div className="flex-main chart" style={{ padding: 5 }}>
          <CooldownBar
            spellId={SPELLS.CONVOKE_SPIRITS.id}
            events={events}
            info={info}
            highlightGaps
          />
        </div>
      )}
      {hasFeralFrenzy && (
        <div className="flex-main chart" style={{ padding: 5 }}>
          <CooldownBar
            spellId={TALENTS_DRUID.FERAL_FRENZY_TALENT.id}
            events={events}
            info={info}
            highlightGaps
          />
        </div>
      )}
    </SubSection>
  );
}
