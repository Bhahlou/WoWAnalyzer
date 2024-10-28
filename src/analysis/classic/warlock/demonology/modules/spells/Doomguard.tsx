import Analyzer, { Options, SELECTED_PLAYER } from 'parser/core/Analyzer';
import SpellLink from 'interface/SpellLink';
import Events, {
  CastEvent,
  DamageEvent,
  DeathEvent,
  FightEndEvent,
  Item,
} from 'parser/core/Events';
import SPELLS from 'common/SPELLS/classic/warlock';
import { PerformanceMark } from 'interface/guide';
import { QualitativePerformance } from 'parser/ui/QualitativePerformance';
import GEAR_SLOTS from 'game/GEAR_SLOTS';
import TRINKETS from 'common/ITEMS/classic/trinkets';
import ItemLink from 'interface/ItemLink';
import enchanting from 'common/SPELLS/classic/enchanting';
import { SpellInfo } from 'parser/core/EventFilter';
import engineering from 'common/SPELLS/classic/engineering';
import tailoring from 'common/SPELLS/classic/tailoring';
import potions from 'common/SPELLS/classic/potions';
import { formatDuration } from 'common/format';
import Icon from 'interface/Icon';

const relevantGearSlotsToCheckProcs: number[] = [
  GEAR_SLOTS.TRINKET1,
  GEAR_SLOTS.TRINKET2,
  GEAR_SLOTS.HANDS,
  GEAR_SLOTS.BACK,
  GEAR_SLOTS.MAINHAND,
];

export type DoomguardData = {
  inferno: {
    summonEvent?: CastEvent;
  };
  doomguard: {
    summonTimestamp: number;
    deathTimestamp: number;
    summonEvent?: CastEvent;
    castEvents: CastEvent[];
    totalDamage?: number;
  };
  summonedDemonSummary: JSX.Element;
};

export type SnapshotQualityEntry = {
  item?: Item;
  relatedBuffs: SpellInfo[];
  snapshotQuality: QualitativePerformance;
  snapshotSummary: JSX.Element;
};

export default class Doomguard extends Analyzer {
  doomguardSummonData: DoomguardData = {
    doomguard: {
      summonTimestamp: 0,
      deathTimestamp: 0,
      castEvents: [],
    },
    inferno: {},
    summonedDemonSummary: <></>,
  };
  snapshotQualityEntries: SnapshotQualityEntry[] = [];
  snapshotAdvice: JSX.Element = (<></>);
  private doomguardId: number = 0;

  constructor(options: Options) {
    super(options);
    this.buildSnapshotEntries();
    this.addEventListener(
      Events.cast.by(SELECTED_PLAYER).spell(SPELLS.SUMMON_DOOMGUARD),
      this.onDoomguardSummonEvent,
    );
    this.addEventListener(
      Events.cast.by(SELECTED_PLAYER).spell([SPELLS.SUMMON_INFERNO]),
      this.onInfernoCast,
    );
    this.addEventListener(
      Events.cast.by(this.doomguardId).spell([SPELLS.DOOM_BOLT]),
      this.onDoomguardCast,
    );
    this.addEventListener(
      Events.damage.by(this.doomguardId).spell([SPELLS.DOOM_BOLT]),
      this.onDoomguardDamage,
    );
    this.addEventListener(Events.death, this.onDoomguardDeath);
    this.addEventListener(Events.fightend, this.onFightEnd);
  }

  private buildSnapshotEntries() {
    // Gear related buffs
    relevantGearSlotsToCheckProcs.forEach((gearSlot) => {
      const equippedItem: Item = this.selectedCombatant._combatantInfo.gear[gearSlot];
      switch (gearSlot) {
        case GEAR_SLOTS.TRINKET1:
        case GEAR_SLOTS.TRINKET2: {
          const itemRelatedBuffs: SpellInfo[] = [];
          const trinket = Object.entries(TRINKETS).find(
            ([_, val]) => val.id === equippedItem.id,
          )?.[1];
          if (!trinket) {
            this.snapshotQualityEntries.push({
              item: trinket,
              relatedBuffs: [],
              snapshotQuality: QualitativePerformance.Ok,
              snapshotSummary: (
                <li>
                  <ItemLink id={equippedItem.id} details={equippedItem}></ItemLink> is unknown from
                  WowAnalyzer database. Reach out on discord to make it added.
                </li>
              ),
            });
          } else {
            trinket.buffs.forEach((buff) => {
              itemRelatedBuffs.push(buff);
            });
            this.snapshotQualityEntries.push({
              item: equippedItem,
              snapshotQuality: QualitativePerformance.Fail,
              relatedBuffs: itemRelatedBuffs,
              snapshotSummary: <></>,
            });
          }
          break;
        }
        case GEAR_SLOTS.HANDS:
          {
            const synapseSpringsAvailable =
              equippedItem.onUseEnchant === engineering.SYNAPSE_SPRINGS_INTEL_BUFF.enchantId;
            this.snapshotQualityEntries.push({
              item: equippedItem,
              snapshotQuality: QualitativePerformance.Fail,
              relatedBuffs: synapseSpringsAvailable ? [engineering.SYNAPSE_SPRINGS_INTEL_BUFF] : [],
              snapshotSummary: synapseSpringsAvailable ? (
                <></>
              ) : (
                <li>
                  <ItemLink id={equippedItem.id} details={equippedItem}></ItemLink> is not enchanted
                  with <SpellLink spell={engineering.SYNAPSE_SPRINGS} />. If you are not engineer,
                  consider to change profession. This is by far the best one, especially as a
                  warlock due to snapshot mechanics.
                </li>
              ),
            });
          }
          break;
        case GEAR_SLOTS.BACK:
          {
            const lighweaveAvailable =
              equippedItem.permanentEnchant === tailoring.LIGHTWEAVE_BUFF_RANK_2.enchantId;
            this.snapshotQualityEntries.push({
              item: equippedItem,
              snapshotQuality: QualitativePerformance.Fail,
              relatedBuffs: lighweaveAvailable ? [tailoring.LIGHTWEAVE_BUFF_RANK_2] : [],
              snapshotSummary: lighweaveAvailable ? (
                <></>
              ) : (
                <li>
                  <ItemLink id={equippedItem.id} details={equippedItem}></ItemLink> is not enchanted
                  with <SpellLink spell={tailoring.LIGHTWEAVE_BUFF_RANK_2} />. If you are not
                  tailor, consider to change profession. This is the 2nd best profession, especially
                  as a warlock due to snapshot mechanics.
                </li>
              ),
            });
          }
          break;
        case GEAR_SLOTS.MAINHAND:
          {
            const powerTorrentAvailable =
              equippedItem.permanentEnchant === enchanting.POWER_TORRENT_BUFF.effectId;
            this.snapshotQualityEntries.push({
              item: equippedItem,
              snapshotQuality: QualitativePerformance.Fail,
              relatedBuffs: powerTorrentAvailable ? [enchanting.POWER_TORRENT_BUFF] : [],
              snapshotSummary: powerTorrentAvailable ? (
                <></>
              ) : (
                <li>
                  <ItemLink id={equippedItem.id} details={equippedItem}></ItemLink> is not enchanted
                  with <SpellLink spell={enchanting.POWER_TORRENT_BUFF} />. This is by far the best
                  weapon enchant, especially as a warlock due to snapshot mechanics.
                </li>
              ),
            });
          }
          break;
      }
    });

    // Volcanic potion
    this.snapshotQualityEntries.push({
      snapshotQuality: QualitativePerformance.Fail,
      relatedBuffs: [potions.VOLCANIC_POTION],
      snapshotSummary: <></>,
    });

    // Prepull hurricane tracking
    this.snapshotQualityEntries.push({
      snapshotQuality: QualitativePerformance.Fail,
      relatedBuffs: [enchanting.HURRICANE_BUFF],
      snapshotSummary: <></>,
    });

    // TODO Check if  DS really interfer with DG ==> Meta clearly doesnt

    // 12024 average normal hit with flask and food, no DS no meta
    // 12024 average normal hit with flask and food, no DS but meta
    // 14467 average normal hit with flask and food, DS no meta
  }
  private onDoomguardSummonEvent(event: CastEvent) {
    this.doomguardSummonData.doomguard.summonEvent = event;
    this.doomguardSummonData.doomguard.summonTimestamp = event.timestamp;

    const doomguardId = this.owner.playerPets.find(
      (pet) => pet.guid === 11859 && pet.petOwner === this.selectedCombatant.player.id,
    )?.id;
    if (doomguardId) {
      this.doomguardId = doomguardId;
    }

    this.snapshotQualityEntries.forEach((entry) => {
      entry.relatedBuffs?.forEach((relatedBuff) => {
        if (this.selectedCombatant.hasBuff(relatedBuff.id, event.timestamp)) {
          entry.snapshotQuality = QualitativePerformance.Good;
          entry.snapshotSummary = (
            <li>
              <PerformanceMark perf={entry.snapshotQuality} /> <SpellLink spell={relatedBuff.id} />{' '}
              {entry.item ? (
                <>
                  {' '}
                  from{' '}
                  <ItemLink id={entry.item.id} details={entry.item} icon={false}>
                    <Icon icon={entry.item.icon} />
                  </ItemLink>
                </>
              ) : (
                <></>
              )}
            </li>
          );
        }
      });
      if (entry.snapshotQuality === QualitativePerformance.Fail) {
        entry.snapshotSummary = (
          <li>
            <PerformanceMark perf={entry.snapshotQuality} />{' '}
            <SpellLink spell={entry.relatedBuffs[0].id} />{' '}
            {entry.item ? (
              <>
                {' '}
                from{' '}
                <ItemLink id={entry.item.id} details={entry.item} icon={false}>
                  <Icon icon={entry.item.icon} />
                </ItemLink>
              </>
            ) : (
              <></>
            )}
          </li>
        );
      }
    });

    const failedEntries = this.snapshotQualityEntries.filter(
      (entry) => entry.snapshotQuality === QualitativePerformance.Fail,
    );

    console.log('failedEntries', failedEntries);

    switch (failedEntries.length) {
      case 0:
        this.snapshotAdvice = <>You snapshotted every possible buff! Perfect!</>;
        break;
      case 1:
        console.log(failedEntries[0].relatedBuffs[0]);
        console.log(enchanting.HURRICANE_BUFF);
        if (failedEntries[0].relatedBuffs[0] === enchanting.HURRICANE_BUFF) {
          this.snapshotAdvice = (
            <>
              You snapshotted every possible buff, unless{' '}
              <SpellLink spell={enchanting.HURRICANE_BUFF} />. <br />
              You can proc both <SpellLink spell={enchanting.POWER_TORRENT_BUFF} /> and{' '}
              <SpellLink spell={enchanting.HURRICANE_BUFF} /> by casting{' '}
              <SpellLink spell={SPELLS.SOUL_HARVEST} /> prepull, with a weapon enchanted with
              Hurricane, then swap to your normal weapon before entering combat. It has only 15%
              chance to happen, but it adds ~3.5% haste to your doomguard if you succeed!
            </>
          );
        } else {
          this.snapshotAdvice = (
            <>
              You failed to snapshot a buff. Try to summon your doomguard when all buffs are active.
            </>
          );
        }
        break;
      default:
        this.snapshotAdvice = (
          <>
            You failed to snapshot several buffs. Try to summon your doomguard when all buffs are
            active.
          </>
        );
        break;
    }
  }
  private onDoomguardDamage(event: DamageEvent) {
    if (this.doomguardSummonData.doomguard.totalDamage === undefined) {
      this.doomguardSummonData.doomguard.totalDamage = 0;
    }
    this.doomguardSummonData.doomguard.totalDamage += event.amount;
  }
  private onFightEnd(event: FightEndEvent) {
    if (
      this.doomguardSummonData.doomguard.summonTimestamp !== 0 &&
      this.doomguardSummonData.doomguard.deathTimestamp === 0
    ) {
      this.doomguardSummonData.doomguard.deathTimestamp = event.timestamp;
    }
  }
  private onDoomguardDeath(event: DeathEvent) {
    if (event.targetID === this.doomguardId) {
      this.doomguardSummonData.doomguard.deathTimestamp = event.timestamp;
      const doomguardDuration =
        event.timestamp - this.doomguardSummonData.doomguard.summonTimestamp;
      if (doomguardDuration >= 64000) {
        this.doomguardSummonData.summonedDemonSummary = (
          <li>
            <PerformanceMark perf={QualitativePerformance.Perfect} /> You casted{' '}
            <SpellLink spell={SPELLS.SUMMON_DOOMGUARD} /> at{' '}
            {formatDuration(
              this.doomguardSummonData.doomguard.summonTimestamp - this.owner.fight.start_time,
            )}
            , for a full <strong>{formatDuration(doomguardDuration)}</strong> duration and{' '}
            <strong>{this.doomguardSummonData.doomguard.totalDamage}</strong> damage <br />
          </li>
        );
      } else {
        this.doomguardSummonData.summonedDemonSummary = (
          <li>
            <PerformanceMark perf={QualitativePerformance.Good} /> You casted{' '}
            <SpellLink spell={SPELLS.SUMMON_DOOMGUARD} /> at{' '}
            {formatDuration(
              this.doomguardSummonData.doomguard.summonTimestamp - this.owner.fight.start_time,
            )}
            , for a <strong>{formatDuration(doomguardDuration)}</strong> duration. It did a total of{' '}
            {this.doomguardSummonData.doomguard.totalDamage} damage, but your doomguard did not live
            for its entire duration. Make sure that cast it soon enough so fight does not end before
            your doomguard expires. <br />
          </li>
        );
      }
    }
  }
  private onDoomguardCast(event: CastEvent) {
    this.doomguardSummonData.doomguard.castEvents.push(event);
    //TODO Check if there's a reliable way to track doomguard not casting for some reasons (being silenced/interrupted/moving/etc.)
  }
  private onInfernoCast(event: CastEvent) {
    this.doomguardSummonData.inferno.summonEvent = event;
    this.doomguardSummonData.summonedDemonSummary = (
      <li>
        <PerformanceMark perf={QualitativePerformance.Fail} /> You used{' '}
        <SpellLink spell={SPELLS.SUMMON_INFERNO} /> at{' '}
        {formatDuration(event.timestamp - this.owner.fight.start_time)} which shares its cooldown
        with <SpellLink spell={SPELLS.SUMMON_DOOMGUARD} />. Unless you face an heavy sustained AoE
        damage situation, where Inferno can cleave for a major part of its duration, or if it is
        absolutely required by your raid, a <strong>doomguard will do more damage</strong>.
      </li>
    );
  }
}
