"""K-pop Demon Hunters League - Advanced RPG with maps and boss battles.

A feature-rich game prototype with:
- Multiple maps (Forest, Volcano, Abyss, Celestial Realm)
- Boss encounters and ranked ladder battles
- Dynamic loot and equipment system
- Hunter progression and stat allocation
- Persistent game state
"""

from __future__ import annotations

import json
import os
import random
import sys
from dataclasses import dataclass, field, asdict
from enum import Enum
from pathlib import Path
from typing import Optional


class MapType(Enum):
    FOREST = "Whisperwood Forest"
    VOLCANO = "Scorched Volcano"
    ABYSS = "The Abyss"
    CELESTIAL = "Celestial Realm"


class EquipmentType(Enum):
    SWORD = "Sword"
    ARMOR = "Armor"
    SHIELD = "Shield"
    RING = "Ring"


@dataclass
class Equipment:
    name: str
    equipment_type: EquipmentType
    attack_bonus: int = 0
    defense_bonus: int = 0
    hp_bonus: int = 0
    rarity: str = "common"  # common, rare, epic, legendary

    def __str__(self) -> str:
        return f"{self.name} ({self.rarity})"


@dataclass
class Hunter:
    name: str
    archetype: str
    level: int = 1
    exp: int = 0
    exp_to_level: int = 100
    hp: int = 100
    max_hp: int = 100
    attack: int = 16
    defense: int = 5
    gold: int = 100
    rank: int = 1
    wins: int = 0
    losses: int = 0
    equipment: list[Equipment] = field(default_factory=list)
    bosses_defeated: list[str] = field(default_factory=list)
    current_map: str = "Whisperwood Forest"

    def add_exp(self, amount: int) -> None:
        self.exp += amount
        while self.exp >= self.exp_to_level:
            self.level_up()

    def level_up(self) -> None:
        self.exp -= self.exp_to_level
        self.level += 1
        self.exp_to_level = int(self.exp_to_level * 1.1)
        self.max_hp += 15
        self.hp = self.max_hp
        self.attack += 3
        self.defense += 1
        print(f"\n🎉 {self.name} leveled up to level {self.level}!")

    def equip(self, equipment: Equipment) -> None:
        self.equipment.append(equipment)
        self.attack += equipment.attack_bonus
        self.defense += equipment.defense_bonus
        self.max_hp += equipment.hp_bonus
        self.hp = self.max_hp
        print(f"Equipped: {equipment}")

    def heal(self, amount: int) -> None:
        self.hp = min(self.max_hp, self.hp + amount)

    def take_damage(self, damage: int) -> None:
        actual = max(0, damage - self.defense)
        self.hp = max(0, self.hp - actual)

    def attack_move(self, opponent: Hunter) -> int:
        damage = self.attack + random.randint(4, 12)
        opponent.take_damage(damage)
        return damage

    def special_move(self, opponent: Hunter) -> int:
        burst = self.attack + random.randint(8, 18)
        opponent.take_damage(burst)
        return burst

    def ultimate_move(self, opponent: Hunter) -> int:
        """Ultimate ability that scales with level."""
        ultimate = self.attack * 1.5 + random.randint(15, 35)
        opponent.take_damage(ultimate)
        return ultimate

    def get_total_stats(self) -> dict:
        return {
            "hp": self.hp,
            "max_hp": self.max_hp,
            "attack": self.attack,
            "defense": self.defense,
        }

    def to_dict(self) -> dict:
        data = asdict(self)
        data["equipment"] = [
            {
                "name": e.name,
                "type": e.equipment_type.value,
                "attack_bonus": e.attack_bonus,
                "defense_bonus": e.defense_bonus,
                "hp_bonus": e.hp_bonus,
                "rarity": e.rarity,
            }
            for e in self.equipment
        ]
        return data

    @staticmethod
    def from_dict(data: dict) -> Hunter:
        equipment = [
            Equipment(
                name=e["name"],
                equipment_type=EquipmentType[e["type"].upper().replace(" ", "_")],
                attack_bonus=e.get("attack_bonus", 0),
                defense_bonus=e.get("defense_bonus", 0),
                hp_bonus=e.get("hp_bonus", 0),
                rarity=e.get("rarity", "common"),
            )
            for e in data.get("equipment", [])
        ]
        data["equipment"] = equipment
        return Hunter(**data)


@dataclass
class Boss:
    name: str
    archetype: str
    map_name: str
    level: int = 5
    hp: int = 200
    max_hp: int = 200
    attack: int = 25
    defense: int = 8
    special_ability: str = "Inferno Burst"
    loot_table: list[Equipment] = field(default_factory=list)
    exp_reward: int = 250

    def take_damage(self, damage: int) -> None:
        actual = max(0, damage - self.defense)
        self.hp = max(0, self.hp - actual)

    def attack_move(self, opponent: Hunter) -> int:
        damage = self.attack + random.randint(8, 16)
        opponent.take_damage(damage)
        return damage

    def special_move(self, opponent: Hunter) -> int:
        burst = self.attack * 1.3 + random.randint(15, 25)
        opponent.take_damage(burst)
        return burst


CHARACTERS = {
    "1": {"name": "Nova Bloom", "attack": 18, "defense": 5, "hp": 100},
    "2": {"name": "Riot Mirage", "attack": 15, "defense": 7, "hp": 110},
    "3": {"name": "Velvet Viper", "attack": 20, "defense": 4, "hp": 95},
    "4": {"name": "Moonlight Mantis", "attack": 17, "defense": 6, "hp": 105},
}

RIVAL_NAMES = [
    "Jin Hwa", "Sora Byte", "Aiko Hex", "Kae Prism", "Mina Fang", "Rae Circuit",
    "Tae Storm", "Hana Nexus", "Koji Flash", "Yuki Echo",
]

MAPS = {
    "1": {
        "name": "Whisperwood Forest",
        "description": "A mystical forest filled with whispers and ancient magic.",
        "difficulty": 1,
    },
    "2": {
        "name": "Scorched Volcano",
        "description": "A fiery mountain where demons emerge from molten depths.",
        "difficulty": 2,
    },
    "3": {
        "name": "The Abyss",
        "description": "A dark chasm where lost souls wander eternally.",
        "difficulty": 3,
    },
    "4": {
        "name": "Celestial Realm",
        "description": "The highest plane of existence, home to the ultimate demons.",
        "difficulty": 4,
    },
}

SAVE_FILE = Path("hunter_save.json")


def create_bosses() -> dict[str, Boss]:
    """Create bosses for each map."""
    bosses = {
        "Whisperwood Forest": Boss(
            name="Whisper Wraith",
            archetype="Spirit Guardian",
            map_name="Whisperwood Forest",
            level=5,
            hp=150,
            max_hp=150,
            attack=20,
            defense=6,
            special_ability="Phantom Strike",
            exp_reward=200,
        ),
        "Scorched Volcano": Boss(
            name="Inferno Overlord",
            archetype="Fire Demon",
            map_name="Scorched Volcano",
            level=10,
            hp=250,
            max_hp=250,
            attack=30,
            defense=8,
            special_ability="Molten Eruption",
            exp_reward=400,
        ),
        "The Abyss": Boss(
            name="Void Leviathan",
            archetype="Ancient Horror",
            map_name="The Abyss",
            level=15,
            hp=400,
            max_hp=400,
            attack=40,
            defense=10,
            special_ability="Void Collapse",
            exp_reward=600,
        ),
        "Celestial Realm": Boss(
            name="Eternal Sovereign",
            archetype="Celestial Demon King",
            map_name="Celestial Realm",
            level=20,
            hp=600,
            max_hp=600,
            attack=50,
            defense=12,
            special_ability="Cosmic Annihilation",
            exp_reward=1000,
        ),
    }

    # Add loot to bosses
    bosses["Whisperwood Forest"].loot_table = [
        Equipment("Phantom Edge", EquipmentType.SWORD, attack_bonus=5, rarity="rare"),
        Equipment("Whisper Cloak", EquipmentType.ARMOR, defense_bonus=3, rarity="rare"),
    ]
    bosses["Scorched Volcano"].loot_table = [
        Equipment("Inferno Blade", EquipmentType.SWORD, attack_bonus=8, rarity="epic"),
        Equipment("Volcanic Plate", EquipmentType.ARMOR, defense_bonus=5, hp_bonus=20, rarity="epic"),
    ]
    bosses["The Abyss"].loot_table = [
        Equipment("Void Reaver", EquipmentType.SWORD, attack_bonus=12, rarity="epic"),
        Equipment("Abyssal Armor", EquipmentType.ARMOR, defense_bonus=7, hp_bonus=40, rarity="epic"),
        Equipment("Ring of Shadows", EquipmentType.RING, attack_bonus=5, defense_bonus=5, rarity="legendary"),
    ]
    bosses["Celestial Realm"].loot_table = [
        Equipment("Celestial Sword", EquipmentType.SWORD, attack_bonus=15, rarity="legendary"),
        Equipment("Divine Plate", EquipmentType.ARMOR, defense_bonus=10, hp_bonus=60, rarity="legendary"),
        Equipment("Crown of Eternity", EquipmentType.RING, attack_bonus=8, defense_bonus=8, hp_bonus=50, rarity="legendary"),
    ]

    return bosses


def print_title() -> None:
    print("\n" + "=" * 50)
    print("    K-pop Demon Hunters League - Advanced")
    print("=" * 50)
    print("  Battle for glory across mystical realms.")
    print("=" * 50 + "\n")


def choose_hunter() -> Hunter:
    print("Choose your champion:")
    for key, details in CHARACTERS.items():
        print(f"{key}. {details['name']} | ATK {details['attack']} | DEF {details['defense']} | HP {details['hp']}")

    while True:
        choice = input("Enter the number of your hunter: ").strip()
        if choice in CHARACTERS:
            details = CHARACTERS[choice]
            name = input("Enter your hunter name: ").strip() or "Player One"
            return Hunter(
                name=name,
                archetype=details["name"],
                hp=details["hp"],
                max_hp=details["hp"],
                attack=details["attack"],
                defense=details["defense"],
            )
        print("Invalid choice. Pick a number from the list.")


def make_rival(rank: int) -> Hunter:
    name = random.choice(RIVAL_NAMES)
    base_attack = 10 + rank * 3
    base_defense = 3 + rank
    rival_hp = 80 + rank * 12
    return Hunter(
        name=name,
        archetype="Rival",
        hp=rival_hp,
        max_hp=rival_hp,
        attack=base_attack,
        defense=base_defense,
    )


def explore_map(player: Hunter, map_name: str, bosses: dict[str, Boss]) -> None:
    """Explore a map with random encounters and boss battles."""
    print(f"\n--- Entering {map_name} ---")
    map_info = next((m for m in MAPS.values() if m["name"] == map_name), None)
    if map_info:
        print(f"📍 {map_info['description']}")

    player.current_map = map_name
    encounter_count = 0

    while True:
        print("\nWhat do you do?")
        print("1. Fight a rival demon hunter")
        print("2. Search for treasure")
        print("3. Challenge the map boss")
        print("4. Return to main hub")

        choice = input("> ").strip()

        if choice == "1":
            rival = make_rival(player.rank)
            if battle(player, rival):
                encounter_count += 1
                print(f"Encounters won: {encounter_count}")

        elif choice == "2":
            gold_found = random.randint(20, 50)
            player.gold += gold_found
            print(f"💰 Found {gold_found} gold!")

        elif choice == "3":
            boss = bosses.get(map_name)
            if boss:
                if boss.name in player.bosses_defeated:
                    print(f"You have already defeated {boss.name} on this map.")
                else:
                    if boss_battle(player, boss, bosses):
                        player.bosses_defeated.append(boss.name)
                        player.gold += 100
                        player.add_exp(boss.exp_reward)

        elif choice == "4":
            break

        else:
            print("Invalid choice.")


def select_map(player: Hunter) -> str:
    """Let player select which map to explore."""
    print("\n--- Available Maps ---")
    for key, info in MAPS.items():
        difficulty = "⭐" * info["difficulty"]
        print(f"{key}. {info['name']} {difficulty}")

    while True:
        choice = input("Select a map (1-4): ").strip()
        if choice in MAPS:
            return MAPS[choice]["name"]
        print("Invalid choice.")


def battle(player: Hunter, opponent: Hunter) -> bool:
    """Turn-based battle system."""
    print(f"\n⚔️  Battle Start: {player.name} vs {opponent.name}")
    print(f"{player.name}: HP {player.hp}/{player.max_hp}")
    print(f"{opponent.name}: HP {opponent.hp}/{opponent.max_hp}\n")

    turn = 0
    while player.hp > 0 and opponent.hp > 0:
        turn += 1
        print(f"--- Turn {turn} ---")
        print("Choose your move:")
        print("1. Basic Attack")
        print("2. Special Attack")
        print("3. Guard")
        print("4. Forfeit")

        move = input("> ").strip()

        if move == "4":
            print(f"{player.name} forfeits.")
            player.losses += 1
            return False

        if move == "1":
            damage = player.attack_move(opponent)
            print(f"{player.name} strikes for {damage} damage.")
        elif move == "2":
            damage = player.special_move(opponent)
            print(f"{player.name} uses Special Attack for {damage} damage!")
        elif move == "3":
            old_defense = player.defense
            player.defense += 6
            print(f"{player.name} guards (Defense: {old_defense} → {player.defense})")
        else:
            print("Invalid move.")
            continue

        if opponent.hp <= 0:
            break

        opponent_action = random.choice(["attack", "special", "guard"])
        if opponent_action == "attack":
            damage = opponent.attack_move(player)
            print(f"{opponent.name} strikes for {damage} damage.")
        elif opponent_action == "special":
            damage = opponent.special_move(player)
            print(f"{opponent.name} uses Special Attack for {damage} damage!")
        else:
            opponent.defense += 4
            print(f"{opponent.name} guards.")

        print(f"{player.name} HP: {player.hp} | {opponent.name} HP: {opponent.hp}\n")

    if player.hp > 0:
        player.wins += 1
        reward_gold = 30 + player.rank * 5
        player.gold += reward_gold
        exp_reward = 50 + player.rank * 10
        player.add_exp(exp_reward)
        print(f"✅ Victory! Gained {reward_gold} gold and {exp_reward} EXP.")
        return True

    print(f"❌ Defeat!")
    player.losses += 1
    player.gold = max(0, player.gold - 10)
    player.hp = max(20, player.hp)
    return False


def boss_battle(player: Hunter, boss: Boss, bosses: dict[str, Boss]) -> bool:
    """Boss battle with special mechanics."""
    print(f"\n🔥 BOSS BATTLE 🔥")
    print(f"Facing: {boss.name} ({boss.archetype})")
    print(f"HP: {boss.hp}/{boss.max_hp} | ATK: {boss.attack} | DEF: {boss.defense}")
    print(f"Special Ability: {boss.special_ability}\n")

    turn = 0
    while player.hp > 0 and boss.hp > 0:
        turn += 1
        print(f"--- Boss Turn {turn} ---")
        print("Choose your move:")
        print("1. Basic Attack")
        print("2. Special Attack")
        print("3. Ultimate Ability (if available)")
        print("4. Guard")
        print("5. Forfeit")

        move = input("> ").strip()

        if move == "5":
            print(f"{player.name} flees from {boss.name}.")
            player.hp = max(20, player.hp)
            return False

        if move == "1":
            damage = player.attack_move(boss)
            print(f"{player.name} strikes for {damage} damage!")
        elif move == "2":
            damage = player.special_move(boss)
            print(f"{player.name} uses Special Attack for {damage} damage!")
        elif move == "3":
            damage = player.ultimate_move(boss)
            print(f"✨ {player.name} unleashes an Ultimate for {damage} damage!")
        elif move == "4":
            player.defense += 8
            print(f"{player.name} braces for impact (Defense +8)")
        else:
            print("Invalid move.")
            continue

        if boss.hp <= 0:
            break

        boss_action = random.choice(["attack", "attack", "special", "guard"])
        if boss_action == "attack":
            damage = boss.attack_move(player)
            print(f"{boss.name} strikes for {damage} damage!")
        elif boss_action == "special":
            damage = boss.special_move(player)
            print(f"{boss.name} uses {boss.special_ability} for {damage} damage!")
        else:
            boss.defense += 5
            print(f"{boss.name} prepares a counterattack.")

        print(f"{player.name} HP: {player.hp} | {boss.name} HP: {boss.hp}\n")

    if player.hp > 0:
        print(f"\n🎉 VICTORY! You have defeated {boss.name}!")
        loot = random.choice(boss.loot_table) if boss.loot_table else None
        if loot:
            player.equip(loot)
            print(f"Legendary Loot: {loot}")
        player.gold += 200
        print(f"Gained 200 gold!")
        return True

    print(f"\n💀 DEFEAT! {boss.name} was too powerful.")
    player.hp = max(20, player.hp)
    return False


def shop(player: Hunter) -> None:
    """In-game shop for upgrades."""
    print("\n--- Ranked Shop ---")
    print("1. Upgrade attack (+4 damage) - 25 gold")
    print("2. Upgrade defense (+4 defense) - 25 gold")
    print("3. Restore health (+50 HP) - 20 gold")
    print("4. Leave shop")

    while True:
        choice = input("> ").strip()
        if choice == "1" and player.gold >= 25:
            player.gold -= 25
            player.attack += 4
            print("✅ Attack upgraded!")
            break
        elif choice == "2" and player.gold >= 25:
            player.gold -= 25
            player.defense += 4
            print("✅ Defense upgraded!")
            break
        elif choice == "3" and player.gold >= 20:
            player.gold -= 20
            player.heal(50)
            print("✅ Health restored!")
            break
        elif choice == "4":
            break
        else:
            print("❌ Not enough gold or invalid input.")


def display_stats(player: Hunter) -> None:
    """Display detailed hunter stats."""
    print("\n" + "=" * 50)
    print(f"  {player.name} - {player.archetype}")
    print("=" * 50)
    print(f"Level: {player.level} | EXP: {player.exp}/{player.exp_to_level}")
    print(f"HP: {player.hp}/{player.max_hp} | ATK: {player.attack} | DEF: {player.defense}")
    print(f"Gold: {player.gold} | Rank: {player.rank}")
    print(f"Record: {player.wins}W - {player.losses}L")
    print(f"Current Map: {player.current_map}")
    print(f"Bosses Defeated: {len(player.bosses_defeated)}")
    if player.equipment:
        print(f"Equipment ({len(player.equipment)}):")
        for eq in player.equipment:
            print(f"  • {eq}")
    print("=" * 50 + "\n")


def save_game(player: Hunter) -> None:
    """Save player data to file."""
    with open(SAVE_FILE, "w") as f:
        json.dump(player.to_dict(), f, indent=2)
    print(f"✅ Game saved to {SAVE_FILE}")


def load_game() -> Optional[Hunter]:
    """Load player data from file."""
    if SAVE_FILE.exists():
        with open(SAVE_FILE, "r") as f:
            data = json.load(f)
            return Hunter.from_dict(data)
    return None


def main() -> None:
    print_title()

    load_choice = input("Load existing game? (y/n): ").strip().lower()
    if load_choice in {"y", "yes"}:
        player = load_game()
        if player:
            print(f"\n✅ Loaded {player.name}!")
            display_stats(player)
        else:
            print("No save file found. Creating new hunter.\n")
            player = choose_hunter()
    else:
        player = choose_hunter()

    bosses = create_bosses()
    print(f"\n👋 Welcome, {player.name}! Your journey continues...")

    while True:
        print("\n--- Main Hub ---")
        print("1. Explore a map")
        print("2. Visit the shop")
        print("3. View stats")
        print("4. Save game")
        print("5. Quit game")

        choice = input("> ").strip()

        if choice == "1":
            map_name = select_map(player)
            explore_map(player, map_name, bosses)

        elif choice == "2":
            shop(player)

        elif choice == "3":
            display_stats(player)

        elif choice == "4":
            save_game(player)

        elif choice == "5":
            save_choice = input("Save before quitting? (y/n): ").strip().lower()
            if save_choice in {"y", "yes"}:
                save_game(player)
            print("\n🎮 Thanks for playing K-pop Demon Hunters League!")
            break

        else:
            print("Invalid choice.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Game interrupted.")
        sys.exit(0)
